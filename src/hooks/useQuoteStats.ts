import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useQuoteStats = () => {
  return useQuery({
    queryKey: ['quote-stats'],
    queryFn: async () => {
      const { data: quotes, error } = await supabase
        .from('ticket_quotes')
        .select('*');

      if (error) throw error;

      const awaitingApproval = quotes.filter(q => q.status === 'awaiting_approval');
      const approved = quotes.filter(q => q.status === 'approved');
      const declined = quotes.filter(q => q.status === 'declined');
      const approvedWithPO = approved.filter(q => q.po_number);
      const paid = quotes.filter(q => q.payment_status === 'paid');

      const totalAwaitingValue = awaitingApproval.reduce((sum, q) => sum + Number(q.amount), 0);
      const totalApprovedValue = approved.reduce((sum, q) => sum + Number(q.amount), 0);
      const totalDeclinedValue = declined.reduce((sum, q) => sum + Number(q.amount), 0);
      const totalPaidValue = paid.reduce((sum, q) => sum + Number(q.amount), 0);

      return {
        awaitingApproval: {
          count: awaitingApproval.length,
          value: totalAwaitingValue,
        },
        approved: {
          count: approved.length,
          value: totalApprovedValue,
          withPO: approvedWithPO.length,
          percentWithPO: approved.length > 0 ? (approvedWithPO.length / approved.length) * 100 : 0,
        },
        declined: {
          count: declined.length,
          value: totalDeclinedValue,
        },
        paid: {
          count: paid.length,
          value: totalPaidValue,
        },
      };
    },
  });
};
