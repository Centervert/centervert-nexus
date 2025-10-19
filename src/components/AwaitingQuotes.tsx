import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, DollarSign } from 'lucide-react';
import { useAwaitingQuotes } from '@/hooks/useAwaitingQuotes';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const AwaitingQuotes = () => {
  const { data: quotes, isLoading } = useAwaitingQuotes();
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="mb-6 md:mb-8">
        <h3 className="text-lg font-semibold mb-4">Quotes Awaiting Approval</h3>
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 md:mb-8">
      <h3 className="text-lg font-semibold mb-4">Quotes Awaiting Approval</h3>
      <div className="grid gap-3">
        {quotes.map((quote) => {
          const ticket = quote.tickets as any;
          const client = quote.clients as any;
          const isExpiringSoon = quote.approval_window_expires_at && 
            new Date(quote.approval_window_expires_at) < new Date(Date.now() + 48 * 60 * 60 * 1000);

          return (
            <Card 
              key={quote.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/tickets/${quote.ticket_id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold mb-1">
                      #{ticket?.ticket_number} - {ticket?.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {client?.name}
                    </p>
                  </div>
                  <Badge variant={isExpiringSoon ? "destructive" : "secondary"} className="shrink-0">
                    {formatCurrency(quote.amount)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {quote.approval_window_expires_at && (
                    <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-destructive font-medium' : ''}`}>
                      <DollarSign className="h-4 w-4" />
                      <span>
                        Expires {formatDistanceToNow(new Date(quote.approval_window_expires_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
