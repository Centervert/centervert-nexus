import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Invoice {
  id: string;
  organization_id: string;
  billcom_invoice_id: string | null;
  invoice_number: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
  amount: number;
  amount_due: number;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  line_items: any;
  billcom_payment_link: string | null;
  billcom_pdf_url: string | null;
  metadata: any;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  organizations?: {
    id: string;
    name: string;
    billing_email: string | null;
  };
}

type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';

export const useInvoices = (filters?: {
  organization_id?: string;
  status?: InvoiceStatus;
}) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, organizations(id, name, billing_email)')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.organization_id) {
        query = query.eq('organization_id', filters.organization_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Invoice[];
    },
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, organizations(id, name, billing_email)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!id,
  });
};

export const useBillingSummary = () => {
  return useQuery({
    queryKey: ['billing-summary'],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('status, amount, amount_due, due_date');

      if (error) throw error;

      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const summary = {
        totalOutstanding: 0,
        overdueAmount: 0,
        overdueCount: 0,
        paidThisMonth: 0,
      };

      invoices?.forEach((invoice: any) => {
        if (invoice.status !== 'paid' && invoice.status !== 'void') {
          summary.totalOutstanding += invoice.amount_due || 0;
          
          if (invoice.due_date && new Date(invoice.due_date) < now) {
            summary.overdueAmount += invoice.amount_due || 0;
            summary.overdueCount++;
          }
        }

        if (invoice.status === 'paid' && invoice.paid_date) {
          const paidDate = new Date(invoice.paid_date);
          if (paidDate >= firstOfMonth) {
            summary.paidThisMonth += invoice.amount || 0;
          }
        }
      });

      return summary;
    },
  });
};
