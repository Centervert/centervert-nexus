import UnifiedLayout from "@/components/UnifiedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Billing = () => {
  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Billing interface coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
};

export default Billing;
