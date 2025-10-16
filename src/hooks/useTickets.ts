import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'awaiting_response' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  categories: {
    name: string;
    description: string | null;
  } | null;
  creator: {
    full_name: string | null;
    email: string;
    company: string | null;
  } | null;
  assigned_profile: {
    full_name: string | null;
    email: string;
    company: string | null;
  } | null;
}

interface UseTicketsParams {
  search?: string;
  status?: string;
  sortBy?: 'created_at' | 'title' | 'priority' | 'status';
}

export const useTickets = (params?: UseTicketsParams) => {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          categories (
            name,
            description
          ),
          creator:created_by (
            full_name,
            email,
            company
          ),
          assigned_profile:assigned_to (
            full_name,
            email,
            company
          )
        `);

      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status as any);
      }

      const sortField = params?.sortBy || 'created_at';
      query = query.order(sortField, { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as Ticket[];
    },
  });
};

export const useTicketStats = () => {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('status');

      if (error) throw error;

      const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        needResponse: tickets.filter(t => t.status === 'awaiting_response').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        total: tickets.length,
      };

      return stats;
    },
  });
};
