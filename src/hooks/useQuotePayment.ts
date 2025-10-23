import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useQuotePayment = (ticketId: string) => {
  const queryClient = useQueryClient();

  const markAsPaid = useMutation({
    mutationFn: async (quoteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, get the ticket to check its status
      const { data: quote } = await supabase
        .from('ticket_quotes')
        .select('ticket_id')
        .eq('id', quoteId)
        .single();

      if (!quote) throw new Error('Quote not found');

      const { data: ticket } = await supabase
        .from('tickets')
        .select('status')
        .eq('id', quote.ticket_id)
        .single();

      // Mark quote as paid
      const { error: quoteError } = await supabase
        .from('ticket_quotes')
        .update({
          payment_status: 'paid',
          marked_paid_by: user.id,
          marked_paid_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // If ticket is awaiting_payment, move it to closed
      if (ticket?.status === 'awaiting_payment') {
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({ status: 'closed' })
          .eq('id', quote.ticket_id);

        if (ticketError) throw ticketError;

        // Create milestone for payment completion
        await supabase
          .from('ticket_milestones')
          .insert({
            ticket_id: quote.ticket_id,
            type: 'payment',
            title: 'Payment received - Ticket completed',
            status: 'completed'
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Quote marked as paid');
    },
    onError: () => {
      toast.error('Failed to mark quote as paid');
    },
  });

  return { markAsPaid };
};
