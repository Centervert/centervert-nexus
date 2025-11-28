import UnifiedLayout from "@/components/UnifiedLayout";
import BillingSummaryCards from "@/components/billing/BillingSummaryCards";
import InvoiceTable from "@/components/billing/InvoiceTable";

const Billing = () => {
  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
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
