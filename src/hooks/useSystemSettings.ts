import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_at: string;
  updated_by: string | null;
}

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      return data as SystemSetting[];
    },
  });
};

export const useStripeSetting = () => {
  return useQuery({
    queryKey: ['system-settings', 'stripe_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'stripe_enabled')
        .maybeSingle();

      if (error) throw error;
      return data?.setting_value === true;
    },
  });
};

export const useUpdateStripeSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: enabled,
          updated_by: user.id,
        })
        .eq('setting_key', 'stripe_enabled');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Stripe payment setting updated');
    },
    onError: (error) => {
      console.error('Error updating Stripe setting:', error);
      toast.error('Failed to update setting');
    },
  });
};
