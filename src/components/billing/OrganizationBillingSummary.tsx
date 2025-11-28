import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { Skeleton } from "@/components/ui/skeleton";

interface OrganizationBillingSummaryProps {
  organizationId: string;
}

const OrganizationBillingSummary = ({ organizationId }: OrganizationBillingSummaryProps) => {
  const { data: invoices, isLoading } = useInvoices({ organization_id: organizationId });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary stats
  const totalPaid = invoices?.reduce((sum, inv) => {
    return inv.status === 'paid' ? sum + inv.amount : sum;
  }, 0) || 0;

  const totalUnpaid = invoices?.reduce((sum, inv) => {
    return inv.status !== 'paid' && inv.status !== 'void' ? sum + inv.amount_due : sum;
  }, 0) || 0;

  const totalOverdue = invoices?.reduce((sum, inv) => {
    return inv.status === 'overdue' ? sum + inv.amount_due : sum;
  }, 0) || 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalUnpaid)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalOverdue)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationBillingSummary;
