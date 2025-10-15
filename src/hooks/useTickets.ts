import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  categories: {
    name: string;
  } | null;
  creator: {
    email: string;
    full_name: string | null;
  } | null;
  assignee: {
    email: string;
    full_name: string | null;
  } | null;
}

interface UseTicketsFilters {
  search?: string;
  status?: string;
  priority?: string;
  sortBy?: 'created_at' | 'title' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const useTickets = (filters?: UseTicketsFilters) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          categories (name),
          creator:profiles!tickets_created_by_fkey (email, full_name),
          assignee:profiles!tickets_assigned_to_fkey (email, full_name)
        `);

      // Apply search filter
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as TicketStatus);
      }

      // Apply priority filter
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority as TicketPriority);
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return data as any as Ticket[];
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
        open: tickets.filter((t) => t.status === 'open').length,
        needResponse: tickets.filter((t) => t.status === 'awaiting_response').length,
        inProgress: tickets.filter((t) => t.status === 'in_progress').length,
        total: tickets.length,
      };

      return stats;
    },
  });
};
