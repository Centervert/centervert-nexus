import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Tag, User, DollarSign, Calendar, Clock } from 'lucide-react';

interface TicketDetailsProps {
  ticket: {
    end_client_name?: string | null;
    client?: {
      name?: string | null;
    } | null;
    creator?: {
      company?: string | null;
      full_name?: string | null;
      email?: string;
    } | null;
    type?: string | null;
    subtype?: string | null;
    budget?: number | null;
    created_at: string;
    updated_at: string;
  };
}

export const TicketDetails = ({ ticket }: TicketDetailsProps) => {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Client</p>
              <p className="text-sm font-medium">
                {ticket.client?.name || ticket.end_client_name || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Type → Subtype</p>
              <p className="text-sm font-medium">
                {ticket.type || 'Not specified'} {ticket.subtype && `→ ${ticket.subtype}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Requested by</p>
              <p className="text-sm font-medium">
                {ticket.creator?.full_name || ticket.creator?.email || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="text-sm font-medium">{formatCurrency(ticket.budget)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm font-medium">{formatDate(ticket.created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm font-medium">{formatDate(ticket.updated_at)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
