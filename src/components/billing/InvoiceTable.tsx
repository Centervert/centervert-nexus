import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Download } from "lucide-react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { format } from "date-fns";

interface InvoiceTableProps {
  organizationId?: string;
}

const InvoiceTable = ({ organizationId }: InvoiceTableProps) => {
  const { data: invoices, isLoading } = useInvoices({ organization_id: organizationId });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleCopyPaymentLink = (invoice: Invoice) => {
    if (invoice.billcom_payment_link) {
      navigator.clipboard.writeText(invoice.billcom_payment_link);
      toast.success('Payment link copied to clipboard');
    } else {
      toast.error('No payment link available');
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    if (invoice.billcom_pdf_url) {
      window.open(invoice.billcom_pdf_url, '_blank');
    } else {
      toast.error('No PDF available');
    }
  };

  const handleOpenInBillCom = (invoice: Invoice) => {
    if (invoice.billcom_invoice_id) {
      window.open(`https://app.bill.com/invoice/${invoice.billcom_invoice_id}`, '_blank');
    } else {
      toast.error('Invoice not synced with Bill.com');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No invoices found</p>
        <p className="text-sm mt-2">Invoices will appear here once synced from Bill.com</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {!organizationId && <TableHead>Organization</TableHead>}
            <TableHead>Invoice #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Amount Due</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              {!organizationId && (
                <TableCell className="font-medium">
                  {invoice.organizations?.name || '—'}
                </TableCell>
              )}
              <TableCell className="font-medium">
                {invoice.invoice_number || '—'}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell>{formatDate(invoice.issue_date)}</TableCell>
              <TableCell>{formatDate(invoice.due_date)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(invoice.amount)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(invoice.amount_due)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyPaymentLink(invoice)}
                    title="Copy payment link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadPDF(invoice)}
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenInBillCom(invoice)}
                    title="Open in Bill.com"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceTable;
