import { Badge } from "@/components/ui/badge";

interface InvoiceStatusBadgeProps {
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
}

const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
    sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
    viewed: { label: 'Viewed', className: 'bg-purple-100 text-purple-800' },
    partial: { label: 'Partially Paid', className: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
    void: { label: 'Void', className: 'bg-gray-100 text-gray-600' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export default InvoiceStatusBadge;
