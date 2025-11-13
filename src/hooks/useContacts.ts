import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhoneNumber {
  number: string;
  type: 'Mobile' | 'Work' | 'Home' | 'Fax';
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  phone_extension: string | null;
  phone_numbers: PhoneNumber[] | any;
  title: string | null;
  organization: string | null;
  contact_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  address: string | null;
  contact_source: string | null;
  last_contact_date: string | null;
  linkedin_url: string | null;
  tags: string[] | any;
  preferred_contact_method: string | null;
  timezone: string | null;
  birthday: string | null;
  status: string;
  lead_score: number | null;
  client_id: string | null;
}

export interface OpportunityContact {
  id: string;
  opportunity_id: string;
  contact_id: string;
  relationship_type: string | null;
  notes: string | null;
  created_at: string;
  contact: Contact;
}

export const useContacts = () => {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
  });
};

export const useContact = (id: string) => {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: any) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create contact');
      console.error('Error creating contact:', error);
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contact> }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] });
      toast.success('Contact updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update contact');
      console.error('Error updating contact:', error);
    },
  });
};

export const useOpportunityContacts = (opportunityId: string) => {
  return useQuery({
    queryKey: ['opportunity-contacts', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_contacts')
        .select('*, contact:contacts(*)')
        .eq('opportunity_id', opportunityId);

      if (error) throw error;
      return data as OpportunityContact[];
    },
    enabled: !!opportunityId,
  });
};

export const useLinkContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      opportunity_id: string;
      contact_id: string;
      relationship_type?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('opportunity_contacts')
        .insert([params])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-contacts', variables.opportunity_id] });
      toast.success('Contact linked successfully');
    },
    onError: (error) => {
      toast.error('Failed to link contact');
      console.error('Error linking contact:', error);
    },
  });
};

export const useUnlinkContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { opportunity_id: string; contact_id: string }) => {
      const { error } = await supabase
        .from('opportunity_contacts')
        .delete()
        .eq('opportunity_id', params.opportunity_id)
        .eq('contact_id', params.contact_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-contacts', variables.opportunity_id] });
      toast.success('Contact unlinked successfully');
    },
    onError: (error) => {
      toast.error('Failed to unlink contact');
      console.error('Error unlinking contact:', error);
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete contact');
      console.error('Error deleting contact:', error);
    },
  });
};
