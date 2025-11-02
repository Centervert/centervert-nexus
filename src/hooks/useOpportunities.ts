import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Opportunity {
  id: string;
  opportunity_number: string;
  title: string;
  description: string | null;
  opportunity_type: 'private' | 'government';
  status: 'lead' | 'qualified' | 'proposal_submitted' | 'awarded' | 'lost' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_value: number | null;
  assigned_to: string | null;
  created_by: string;
  issuing_organization: string | null;
  rfp_number: string | null;
  procurement_officer_name: string | null;
  procurement_officer_email: string | null;
  procurement_officer_phone: string | null;
  submission_url: string | null;
  submission_address: string | null;
  conference_date: string | null;
  conference_type: string | null;
  conference_location: string | null;
  conference_link: string | null;
  issue_date: string | null;
  questions_deadline: string | null;
  submission_deadline: string | null;
  award_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    full_name: string | null;
    email: string;
  };
  creator?: {
    full_name: string | null;
    email: string;
  };
}

export const useOpportunities = () => {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user details separately
      const userIds = [...new Set([...data.map(d => d.assigned_to), ...data.map(d => d.created_by)].filter(Boolean))];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const usersMap = new Map(users?.map(u => [u.id, u]));

      return data.map(opp => ({
        ...opp,
        assigned_user: opp.assigned_to ? usersMap.get(opp.assigned_to) : undefined,
        creator: usersMap.get(opp.created_by),
      })) as Opportunity[];
    },
  });
};

export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch user details
      const userIds = [data.assigned_to, data.created_by].filter(Boolean);
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const usersMap = new Map(users?.map(u => [u.id, u]));

      return {
        ...data,
        assigned_user: data.assigned_to ? usersMap.get(data.assigned_to) : undefined,
        creator: usersMap.get(data.created_by),
      } as Opportunity;
    },
    enabled: !!id,
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunity: any) => {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([opportunity])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Opportunity created successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to create opportunity';
      toast.error(errorMessage);
      console.error('Error creating opportunity:', error);
    },
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-stats'] });
      toast.success('Opportunity updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update opportunity');
      console.error('Error updating opportunity:', error);
    },
  });
};

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Opportunity deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete opportunity');
      console.error('Error deleting opportunity:', error);
    },
  });
};

export const useOpportunityStats = () => {
  return useQuery({
    queryKey: ['opportunity-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('status, estimated_value, submission_deadline');

      if (error) throw error;

      const stats = {
        total: data.length,
        pipelineValue: data.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0),
        activeLeads: data.filter(opp => opp.status === 'lead' || opp.status === 'qualified').length,
        upcomingDeadlines: data.filter(opp => {
          if (!opp.submission_deadline) return false;
          const deadline = new Date(opp.submission_deadline);
          const now = new Date();
          const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil > 0 && daysUntil <= 30;
        }).length,
      };

      return stats;
    },
  });
};
