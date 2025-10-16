import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ManagedService {
  id: string;
  original_ticket_id: string | null;
  client_id: string;
  service_type: string;
  service_name: string;
  description: string | null;
  monthly_amount: number;
  billing_interval: string;
  billing_start_date: string;
  next_billing_date: string;
  status: 'active' | 'paused' | 'cancelled';
  deliverables: string[] | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  client?: {
    name: string;
  };
  original_ticket?: {
    title: string;
    ticket_number: number;
  };
}

export const useManagedServices = (filters?: {
  status?: string;
  clientId?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['managed-services', filters],
    queryFn: async () => {
      let query = supabase
        .from('managed_services')
        .select(`
          *,
          client:clients(name),
          original_ticket:tickets(title, ticket_number)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.search) {
        query = query.ilike('service_name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ManagedService[];
    },
  });
};

export const useManagedService = (id: string) => {
  return useQuery({
    queryKey: ['managed-service', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('managed_services')
        .select(`
          *,
          client:clients(name, phone, billing_address),
          original_ticket:tickets(
            id,
            title,
            ticket_number,
            description,
            created_at,
            resolved_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ManagedService;
    },
  });
};

export const useManagedServicesStats = () => {
  return useQuery({
    queryKey: ['managed-services-stats'],
    queryFn: async () => {
      const { data: services, error } = await supabase
        .from('managed_services')
        .select('status, monthly_amount');

      if (error) throw error;

      const active = services.filter(s => s.status === 'active').length;
      const paused = services.filter(s => s.status === 'paused').length;
      const totalMRR = services
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + Number(s.monthly_amount), 0);

      return {
        active,
        paused,
        totalMRR,
        total: services.length,
      };
    },
  });
};
