import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface ClientTicketsProps {
  clientId: string;
}

export const ClientTickets = ({ clientId }: ClientTicketsProps) => {
  const navigate = useNavigate();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['client-tickets', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading tickets...</p>
        ) : tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 border-b pb-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">#{ticket.ticket_number} - {ticket.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                </div>
                <Badge className="self-start sm:self-center shrink-0">{ticket.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No tickets yet</p>
        )}
      </CardContent>
    </Card>
  );
};
