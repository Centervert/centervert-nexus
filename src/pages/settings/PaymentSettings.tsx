import SettingsSidebar from '@/components/SettingsSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard } from 'lucide-react';
import { useStripeSetting, useUpdateStripeSetting } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';

const PaymentSettings = () => {
  const { data: stripeEnabled, isLoading } = useStripeSetting();
  const updateStripeMutation = useUpdateStripeSetting();

  const handleStripeToggle = async (enabled: boolean) => {
    try {
      await updateStripeMutation.mutateAsync(enabled);
    } catch (error) {
      console.error('Error updating Stripe setting:', error);
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
              <CreditCard className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Payment Settings</h1>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Payment Configuration</h2>
              <p className="text-muted-foreground mt-1">
                Configure payment methods and billing preferences
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Stripe Payments</CardTitle>
                <CardDescription>
                  Enable or disable Stripe payment processing for quotes and invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="stripe-enabled">Enable Stripe Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow clients to pay via credit card through Stripe
                    </p>
                  </div>
                  <Switch
                    id="stripe-enabled"
                    checked={stripeEnabled || false}
                    onCheckedChange={handleStripeToggle}
                    disabled={isLoading || updateStripeMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PaymentSettings;
