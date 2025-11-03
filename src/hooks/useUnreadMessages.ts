import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useTicketUnreadCount = (ticketId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ticket-unread-count', ticketId, user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get user's last read timestamp
      const { data: receipt } = await supabase
        .from('ticket_message_read_receipts')
        .select('last_read_at')
        .eq('ticket_id', ticketId)
        .eq('user_id', user.id)
        .single();

      const lastReadAt = receipt?.last_read_at || '1970-01-01';

      // Count messages after last read that aren't from the current user
      const { count, error } = await supabase
        .from('ticket_messages')
        .select('*', { count: 'exact', head: true })
        .eq('ticket_id', ticketId)
        .neq('user_id', user.id)
        .gt('created_at', lastReadAt);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && !!ticketId,
  });
};

export const useOpportunityUnreadCount = (opportunityId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['opportunity-unread-count', opportunityId, user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get user's last read timestamp
      const { data: receipt } = await supabase
        .from('opportunity_message_read_receipts')
        .select('last_read_at')
        .eq('opportunity_id', opportunityId)
        .eq('user_id', user.id)
        .single();

      const lastReadAt = receipt?.last_read_at || '1970-01-01';

      // Count messages after last read that aren't from the current user
      const { count, error } = await supabase
        .from('opportunity_messages')
        .select('*', { count: 'exact', head: true })
        .eq('opportunity_id', opportunityId)
        .neq('user_id', user.id)
        .gt('created_at', lastReadAt);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && !!opportunityId,
  });
};

export const useMarkTicketMessagesRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('ticket_message_read_receipts')
        .upsert({
          ticket_id: ticketId,
          user_id: user.id,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'ticket_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-unread-count', ticketId, user?.id] });
    },
  });
};

export const useMarkOpportunityMessagesRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunityId: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('opportunity_message_read_receipts')
        .upsert({
          opportunity_id: opportunityId,
          user_id: user.id,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'opportunity_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, opportunityId) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-unread-count', opportunityId, user?.id] });
    },
  });
};
