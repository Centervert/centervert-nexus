import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface ClientPortalSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClientPortalSettings = ({ open, onOpenChange }: ClientPortalSettingsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-portal-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company, phone, client_id, notification_preferences')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  // Auto payment functionality removed - will be rebuilt with new system
  const autoPaymentEnabled = false;
  const updateAutoPayment = async () => {};
  const isUpdatingPayment = false;

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email_on_new_message: true,
    email_on_invoice_due: true,
    email_on_project_update: true,
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
      });
      if (profile.notification_preferences) {
        setNotificationPrefs(profile.notification_preferences as any);
      }
    }
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('No user ID');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-settings', user?.id] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  // Update notification preferences mutation
  const updateNotifications = useMutation({
    mutationFn: async (prefs: typeof notificationPrefs) => {
      if (!user?.id) throw new Error('No user ID');
      
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: prefs })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-settings', user?.id] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification preferences');
    },
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile.mutateAsync(formData);
    setIsSaving(false);
  };

  const handleNotificationToggle = async (key: keyof typeof notificationPrefs) => {
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    await updateNotifications.mutateAsync(newPrefs);
  };

  if (profileLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Account Settings</SheetTitle>
          <SheetDescription>
            Manage your account information and preferences
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Account Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="email">Primary Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <Button 
              onClick={handleSaveProfile} 
              disabled={isSaving || updateProfile.isPending}
              className="w-full"
            >
              {isSaving || updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>

          <Separator />

          {/* Payment Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Payment Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-payment">Automatic Payments</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically charge invoices on due date
                </p>
              </div>
              <Switch
                id="auto-payment"
                checked={autoPaymentEnabled}
                onCheckedChange={updateAutoPayment}
                disabled={isUpdatingPayment}
              />
            </div>
          </div>

          <Separator />

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Notification Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-messages">New Messages</Label>
                  <p className="text-xs text-muted-foreground">
                    Email notifications for new messages
                  </p>
                </div>
                <Switch
                  id="notif-messages"
                  checked={notificationPrefs.email_on_new_message}
                  onCheckedChange={() => handleNotificationToggle('email_on_new_message')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-invoices">Invoice Due Dates</Label>
                  <p className="text-xs text-muted-foreground">
                    Reminders for upcoming invoice due dates
                  </p>
                </div>
                <Switch
                  id="notif-invoices"
                  checked={notificationPrefs.email_on_invoice_due}
                  onCheckedChange={() => handleNotificationToggle('email_on_invoice_due')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-projects">Project Updates</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications for project milestones
                  </p>
                </div>
                <Switch
                  id="notif-projects"
                  checked={notificationPrefs.email_on_project_update}
                  onCheckedChange={() => handleNotificationToggle('email_on_project_update')}
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientPortalSettings;
