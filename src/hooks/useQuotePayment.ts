import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useQuotePayment = (ticketId: string) => {
  const queryClient = useQueryClient();

  const markAsPaid = useMutation({
    mutationFn: async (quoteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          payment_status: 'paid',
          marked_paid_by: user.id,
          marked_paid_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote marked as paid');
    },
    onError: () => {
      toast.error('Failed to mark quote as paid');
    },
  });

  return { markAsPaid };
};
