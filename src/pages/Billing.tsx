import UnifiedLayout from "@/components/UnifiedLayout";
import BillingSummaryCards from "@/components/billing/BillingSummaryCards";
import InvoiceTable from "@/components/billing/InvoiceTable";
import { Button } from "@/components/ui/button";
import { RefreshCw, Link } from "lucide-react";
import { useSyncInvoices, useSyncCustomers } from "@/hooks/useSyncInvoices";

const Billing = () => {
  const syncInvoices = useSyncInvoices();
  const syncCustomers = useSyncCustomers();

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground">Manage invoices and payments</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncCustomers.mutate()}
              disabled={syncCustomers.isPending}
            >
              <Link className="h-4 w-4 mr-2" />
              {syncCustomers.isPending ? 'Linking...' : 'Link Customers'}
            </Button>
            <Button
              variant="outline"
              onClick={() => syncInvoices.mutate(undefined)}
              disabled={syncInvoices.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncInvoices.isPending ? 'animate-spin' : ''}`} />
              {syncInvoices.isPending ? 'Syncing...' : 'Sync Invoices'}
            </Button>
          </div>
        </div>

        <BillingSummaryCards />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Invoices</h2>
          </div>
          <InvoiceTable />
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default Billing;
