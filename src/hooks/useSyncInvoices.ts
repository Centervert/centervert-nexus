import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSyncInvoices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId?: string) => {
      const payload = organizationId ? { organization_id: organizationId } : {};
      
      const { data, error } = await supabase.functions.invoke('sync-billcom-invoices', {
        body: payload,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      
      const count = data?.syncedCount || 0;
      toast.success(`Successfully synced ${count} invoice${count !== 1 ? 's' : ''} from Bill.com`);
    },
    onError: (error) => {
      console.error('Error syncing invoices:', error);
      toast.error('Failed to sync invoices from Bill.com');
    },
  });
};

export const useSyncCustomers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-billcom-customers');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      const linked = data?.linked || 0;
      toast.success(`Successfully linked ${linked} organization${linked !== 1 ? 's' : ''} to Bill.com customers`);
    },
    onError: (error) => {
      console.error('Error syncing customers:', error);
      toast.error('Failed to sync Bill.com customers');
    },
  });
};
