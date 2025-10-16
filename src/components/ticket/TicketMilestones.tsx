import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquare,
  PlayCircle,
  RefreshCw,
  Send,
  Ticket,
  XCircle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Milestone {
  id: string;
  type: string;
  title: string;
  description: string | null;
  person_name: string | null;
  status: string;
  created_at: string;
}

interface TicketMilestonesProps {
  ticketId: string;
}

export const TicketMilestones = ({ ticketId }: TicketMilestonesProps) => {
  const queryClient = useQueryClient();

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['ticket-milestones', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_milestones')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Milestone[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`ticket_milestones:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_milestones',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-milestones', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  const getMilestoneIcon = (type: string) => {
    const icons: Record<string, typeof Ticket> = {
      ticket_created: Ticket,
      quote_sent: Send,
      quote_approved: CheckCircle2,
      quote_declined: XCircle,
      work_started: PlayCircle,
      work_completed: CheckCircle2,
      payment_received: DollarSign,
      message_sent: MessageSquare,
      status_change: RefreshCw,
    };
    return icons[type] || Clock;
  };

  const getMilestoneColor = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-slate-400';
    if (status === 'completed') return 'bg-green-500';

    const colors: Record<string, string> = {
      ticket_created: 'bg-blue-500',
      quote_sent: 'bg-yellow-500',
      quote_approved: 'bg-green-500',
      quote_declined: 'bg-red-500',
      work_started: 'bg-purple-500',
      work_completed: 'bg-green-500',
      payment_received: 'bg-emerald-500',
      message_sent: 'bg-blue-400',
      status_change: 'bg-indigo-500',
    };
    return colors[type] || 'bg-gray-500';
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading milestones...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestones</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No milestones yet
          </p>
        ) : (
          <div className="relative pr-2">
            {/* Timeline line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />

            {/* Milestones */}
            <div className="space-y-3">
              {milestones.map((milestone, index) => {
                const Icon = getMilestoneIcon(milestone.type);
                const colorClass = getMilestoneColor(milestone.type, milestone.status);

                return (
                  <div 
                    key={milestone.id} 
                    className="relative pl-10 pr-2 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                  >
                    {/* Icon */}
                    <div
                      className={`absolute left-0 top-3 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-snug">{milestone.title}</h4>
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        {milestone.person_name && (
                          <>
                            <span className="font-medium">{milestone.person_name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatDate(milestone.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
