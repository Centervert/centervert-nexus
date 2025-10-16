import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useStripeSetting, useUpdateStripeSetting } from '@/hooks/useSystemSettings';
import { CreditCard } from 'lucide-react';

const Admin = () => {
  const { data: stripeEnabled, isLoading: isLoadingStripe } = useStripeSetting();
  const updateStripeSetting = useUpdateStripeSetting();

  const handleStripeToggle = (checked: boolean) => {
    updateStripeSetting.mutate(checked);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
          </div>

          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Admin Settings</h1>
              <p className="text-muted-foreground">Manage system settings and configuration</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <CardTitle>Payment Settings</CardTitle>
                  </div>
                  <CardDescription>Control payment integration visibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="stripe-toggle" className="text-base font-medium">
                        Enable Stripe Payments
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show Stripe payment options to clients across the application
                      </p>
                    </div>
                    <Switch
                      id="stripe-toggle"
                      checked={stripeEnabled ?? false}
                      onCheckedChange={handleStripeToggle}
                      disabled={isLoadingStripe || updateStripeSetting.isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>View and manage user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>User management will be available once the database is configured.</p>
                    <p className="text-sm mt-2">Run the provided database migrations to enable this feature.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
