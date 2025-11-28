import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillComLog {
  id: string;
  organization_id: string;
  activity_type: 'customer_linked' | 'customer_auto_linked' | 'invoice_synced' | 'sync_completed' | 'sync_failed' | 'manual_link';
  message: string;
  metadata: any;
  created_at: string;
  created_by: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export const useBillComLogs = (organizationId?: string) => {
  return useQuery({
    queryKey: ['billcom-logs', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('billcom_sync_logs')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as BillComLog[];
    },
    enabled: !!organizationId || organizationId === undefined,
  });
};
