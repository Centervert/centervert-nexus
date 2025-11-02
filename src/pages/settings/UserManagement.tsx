import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SettingsSidebar from '@/components/SettingsSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Mail, Shield, Clock, CheckCircle, XCircle, Users, UserCheck, UserPlus, MoreVertical, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('team');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_roles');
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles to get client_id information
  const { data: profiles } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, client_id');
      if (error) throw error;
      return data;
    },
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending') // Only get pending invitations
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Filter out expired invitations that should be removed
      const now = new Date();
      return data?.filter(inv => new Date(inv.expires_at) > now) || [];
    },
  });

  // Separate internal team from client users
  const internalUsers = users?.filter(user => {
    const profile = profiles?.find(p => p.id === user.id);
    return !profile?.client_id;
  });

  const clientUsers = users?.filter(user => {
    const profile = profiles?.find(p => p.id === user.id);
    return profile?.client_id;
  });

  const filteredInternalUsers = internalUsers?.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClientUsers = clientUsers?.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-user-invite', {
        body: { invitationId }
      });

      if (error) throw error;

      toast.success(`Invitation resent to ${email}`);
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'agent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SettingsSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h1 className="text-lg font-semibold">User Management</h1>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-7xl space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-4xl font-bold">{users?.length || 0}</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <span>↑ 12.04%</span>
                      <span className="text-muted-foreground">Last 30 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-4xl font-bold">{users?.length || 0}</p>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <span>↑ 8.5%</span>
                      <span className="text-muted-foreground">Last 30 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pending Invitations</p>
                    <p className="text-4xl font-bold">{invitations?.length || 0}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>Awaiting response</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">User Management</h2>
            </div>

            {/* Tabs for Team vs Client Users */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="team">
                  Team Members ({internalUsers?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="clients">
                  Client Users ({clientUsers?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Team Members Tab */}
              <TabsContent value="team" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search team members..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-background"
                        />
                      </div>
                      <InviteUserDialog
                        trigger={
                          <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2">
                            <Plus className="h-4 w-4" />
                            Add Team Member
                          </Button>
                        }
                      />
                    </div>
                    {/* Team Members Table */}
                    <div className="border rounded-lg overflow-hidden bg-background">
                      <div className="grid grid-cols-[1fr_200px_150px_80px] gap-4 px-6 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b">
                        <div>Team Member</div>
                        <div>Joined</div>
                        <div>Role</div>
                        <div className="text-center">Action</div>
                      </div>

                      {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          Loading team members...
                        </div>
                      ) : filteredInternalUsers && filteredInternalUsers.length > 0 ? (
                        <div className="divide-y">
                          {filteredInternalUsers.map((user) => {
                            const initials = user.full_name
                              ?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase() || user.email?.substring(0, 2).toUpperCase() || 'U';

                            return (
                              <div
                                key={user.id}
                                className="grid grid-cols-[1fr_200px_150px_80px] gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{user.full_name || 'Unnamed User'}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                                </div>
                                <div className="flex gap-2">
                                  {user.roles?.filter((role) => role !== 'user').map((role) => (
                                    <Badge 
                                      key={role} 
                                      variant={getRoleBadgeVariant(role)}
                                      className="capitalize"
                                    >
                                      {role}
                                    </Badge>
                                  ))}
                                  {(!user.roles || user.roles.every((r) => r === 'user')) && (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </div>
                                <div className="flex justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem>Edit Roles</DropdownMenuItem>
                                      <DropdownMenuItem>View Details</DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        Remove User
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          {searchQuery ? 'No team members found matching your search' : 'No team members yet'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Client Users Tab */}
              <TabsContent value="clients" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search client users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-background"
                        />
                      </div>
                    </div>

                    {/* Client Users Table */}
                    <div className="border rounded-lg overflow-hidden bg-background">
                      <div className="grid grid-cols-[1fr_200px_150px_80px] gap-4 px-6 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b">
                        <div>Client User</div>
                        <div>Joined</div>
                        <div>Role</div>
                        <div className="text-center">Action</div>
                      </div>

                      {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                          Loading client users...
                        </div>
                      ) : filteredClientUsers && filteredClientUsers.length > 0 ? (
                        <div className="divide-y">
                          {filteredClientUsers.map((user) => {
                            const initials = user.full_name
                              ?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase() || user.email?.substring(0, 2).toUpperCase() || 'U';

                            return (
                              <div
                                key={user.id}
                                className="grid grid-cols-[1fr_200px_150px_80px] gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-muted">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{user.full_name || 'Unnamed User'}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                                </div>
                                <div className="flex gap-2">
                                  {user.roles?.filter((role) => role !== 'user').map((role) => (
                                    <Badge 
                                      key={role} 
                                      variant={getRoleBadgeVariant(role)}
                                      className="capitalize"
                                    >
                                      {role}
                                    </Badge>
                                  ))}
                                  {(!user.roles || user.roles.every((r) => r === 'user')) && (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </div>
                                <div className="flex justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem>View Details</DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        Deactivate
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          {searchQuery ? 'No client users found matching your search' : 'No client users yet'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    {invitations?.length || 0} pending invitation(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-background">
                    {/* Invitations Header */}
                    <div className="grid grid-cols-[1fr_200px_150px_80px] gap-4 px-6 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b">
                      <div>Email</div>
                      <div>Sent</div>
                      <div>Status</div>
                      <div className="text-center">Action</div>
                    </div>

                    {/* Invitations Body */}
                    {invitationsLoading ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Loading invitations...
                      </div>
                    ) : (
                      <div className="divide-y">
                        {invitations.map((invitation) => {
                          const isExpired = new Date(invitation.expires_at) < new Date();
                          const isPending = invitation.status === 'pending' && !isExpired;

                          return (
                            <div
                              key={invitation.id}
                              className="grid grid-cols-[1fr_200px_150px_80px] gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-muted">
                                    {invitation.email.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{invitation.email}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Role: <span className="capitalize">{invitation.role}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                              </div>
                              <div>
                                <Badge 
                                  variant={isPending ? "secondary" : isExpired ? "destructive" : "default"}
                                  className="gap-1"
                                >
                                  {isPending && <Clock className="h-3 w-3" />}
                                  {isExpired && <XCircle className="h-3 w-3" />}
                                  {!isPending && !isExpired && <CheckCircle className="h-3 w-3" />}
                                  {isPending ? 'Pending' : isExpired ? 'Expired' : 'Accepted'}
                                </Badge>
                              </div>
                              <div className="flex justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 bg-popover z-50">
                                    <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id, invitation.email)}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Resend
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UserManagement;
