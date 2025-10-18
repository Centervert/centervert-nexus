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
import { Plus, Search, Mail, Shield } from 'lucide-react';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { format } from 'date-fns';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_roles');
      if (error) throw error;
      return data;
    },
  });

  const filteredUsers = users?.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          <div className="p-4 md:p-8 max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Users & Permissions</h2>
                <p className="text-muted-foreground mt-1">
                  Manage user accounts, roles, and access permissions
                </p>
              </div>
              <InviteUserDialog
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite User
                  </Button>
                }
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      {users?.length || 0} total users in the system
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => {
                      const initials = user.full_name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase() || user.email?.substring(0, 2).toUpperCase() || 'U';

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">
                                Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {user.roles?.map((role) => (
                                <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No users found matching your search' : 'No users yet'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UserManagement;
