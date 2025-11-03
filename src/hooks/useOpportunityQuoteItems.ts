import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OpportunityQuoteItem {
  id: string;
  opportunity_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  item_type: 'one_time' | 'monthly';
  created_at: string;
  updated_at: string;
}

export const useOpportunityQuoteItems = (opportunityId: string) => {
  return useQuery({
    queryKey: ['opportunity-quote-items', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_quote_items')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OpportunityQuoteItem[];
    },
    enabled: !!opportunityId,
  });
};

export const useCreateQuoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<OpportunityQuoteItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('opportunity_quote_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-quote-items', variables.opportunity_id] });
      toast.success('Line item added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add line item: ' + error.message);
    },
  });
};

export const useUpdateQuoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OpportunityQuoteItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('opportunity_quote_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-quote-items', data.opportunity_id] });
      toast.success('Line item updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update line item: ' + error.message);
    },
  });
};

export const useDeleteQuoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, opportunityId }: { id: string; opportunityId: string }) => {
      const { error } = await supabase
        .from('opportunity_quote_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { opportunityId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-quote-items', data.opportunityId] });
      toast.success('Line item deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete line item: ' + error.message);
    },
  });
};
