import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'awaiting_response' | 'resolved' | 'pending_acknowledgment' | 'awaiting_payment' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  due_date: string | null;
  ticket_number: number | null;
  budget: number | null;
  type: string | null;
  subtype: string | null;
  end_client_name: string | null;
  client_id: string | null;
  categories: {
    name: string;
    description: string | null;
  } | null;
  client: {
    name: string;
    client_type: string;
    managing_agency: {
      name: string;
    } | null;
    po_system_enabled: boolean | null;
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
  ticket_quotes: Array<{
    id: string;
    status: string;
    po_number: string | null;
    amount: number;
    approved_by: string | null;
    approved_at: string | null;
    approver?: {
      full_name: string | null;
      email: string;
    } | null;
  }>;
  managed_service_id: string | null;
}

interface UseTicketsParams {
  search?: string;
  status?: string;
  sortBy?: 'created_at' | 'title' | 'priority' | 'status' | 'client';
  sortDirection?: 'asc' | 'desc';
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
          client:client_id (
            name,
            client_type,
            po_system_enabled,
            managing_agency:managing_agency_id (
              name
            )
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
          ),
          ticket_quotes (
            id,
            status,
            po_number,
            amount,
            approved_by,
            approved_at,
            approver:profiles!approved_by(full_name, email)
          )
        `);

      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status as any);
      }

      const sortField = params?.sortBy || 'created_at';
      const ascending = params?.sortDirection === 'asc';
      
      if (sortField === 'client') {
        query = query.order('client_id', { ascending, nullsFirst: false });
      } else {
        query = query.order(sortField, { ascending });
      }

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
