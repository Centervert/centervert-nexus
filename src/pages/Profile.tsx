import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SettingsSidebar from '@/components/SettingsSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, User } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, company:companies(name)')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;

      return {
        ...profileData,
        roles: roles.map(r => r.role)
      };
    },
    enabled: !!user?.id
  });

  const [formData, setFormData] = useState({
    full_name: '',
    company: '',
    phone: ''
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  });

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      company: profile?.company || '',
      phone: profile?.phone || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SettingsSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Profile</h1>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <p className="text-muted-foreground mt-1">
                Manage your account details and preferences
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Your name and contact details
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={handleEdit}>Edit Profile</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Your company name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Your phone number"
                      />
                    </div>

                    <Separator />

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{user?.email}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Company</Label>
                        <p className="font-medium">{profile?.company || 'Not set'}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="font-medium">{profile?.phone || 'Not set'}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Company</Label>
                        <p className="font-medium">{profile?.company || 'Not assigned'}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Roles</Label>
                        <div className="flex gap-2 flex-wrap">
                          {profile?.roles && profile.roles.length > 0 ? (
                            profile.roles.map((role) => (
                              <Badge key={role} variant="secondary">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">No roles assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
