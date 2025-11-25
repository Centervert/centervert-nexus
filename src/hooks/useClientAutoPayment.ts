import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClientAutoPayment = (clientId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: autoPaymentEnabled, isLoading } = useQuery({
    queryKey: ['client-auto-payment', clientId],
    queryFn: async () => {
      if (!clientId) return false;
      
      const { data, error } = await supabase
        .from('clients')
        .select('auto_payment_enabled')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data?.auto_payment_enabled || false;
    },
    enabled: !!clientId,
  });

  const updateAutoPayment = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!clientId) throw new Error('No client ID');

      const { error } = await supabase
        .from('clients')
        .update({ auto_payment_enabled: enabled })
        .eq('id', clientId);

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['client-auto-payment', clientId] });
      toast.success(
        enabled 
          ? 'Auto-payment enabled. Your invoices will be charged automatically on their due dates.' 
          : 'Auto-payment disabled. You can pay invoices manually when ready.'
      );
    },
    onError: (error) => {
      console.error('Error updating auto-payment setting:', error);
      toast.error('Failed to update auto-payment setting');
    },
  });

  return {
    autoPaymentEnabled: autoPaymentEnabled || false,
    isLoading,
    updateAutoPayment: updateAutoPayment.mutate,
    isUpdating: updateAutoPayment.isPending,
  };
};
