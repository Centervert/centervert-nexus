import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAwaitingQuotes = () => {
  return useQuery({
    queryKey: ['awaiting-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_quotes')
        .select(`
          id,
          amount,
          created_at,
          approval_window_expires_at,
          ticket_id,
          client_id,
          tickets:ticket_id (
            id,
            title,
            ticket_number
          ),
          clients:client_id (
            id,
            name
          )
        `)
        .eq('status', 'awaiting_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
