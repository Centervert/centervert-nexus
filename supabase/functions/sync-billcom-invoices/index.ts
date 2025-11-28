import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BillComSession {
  sessionId: string;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { organization_id } = await req.json();

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    if (!org.billcom_customer_id) {
      throw new Error('Organization not linked to Bill.com customer');
    }

    // Get Bill.com session
    const session = await getBillComSession();

    // Fetch invoices from Bill.com
    const invoices = await fetchBillComInvoices(session, org.billcom_customer_id);

    // Sync each invoice to local database
    let syncedCount = 0;
    for (const invoice of invoices) {
      await syncInvoice(supabase, org.id, invoice);
      syncedCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncedCount,
        organization: org.name 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getBillComSession(): Promise<BillComSession> {
  const orgId = Deno.env.get('BILLCOM_ORG_ID')!;
  const devKey = Deno.env.get('BILLCOM_DEV_KEY')!;
  const password = Deno.env.get('BILLCOM_PASSWORD')!;

  const response = await fetch('https://api.bill.com/api/v3/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orgId,
      devKey,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Bill.com login failed:', error);
    throw new Error(`Bill.com authentication failed: ${error}`);
  }

  const data = await response.json();
  return {
    sessionId: data.sessionId,
    userId: data.userId,
  };
}

async function fetchBillComInvoices(session: BillComSession, customerId: string): Promise<any[]> {
  const devKey = Deno.env.get('BILLCOM_DEV_KEY')!;
  const orgId = Deno.env.get('BILLCOM_ORG_ID')!;

  const response = await fetch('https://api.bill.com/api/v3/Crud/Read/Invoice.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      devKey,
      sessionId: session.sessionId,
      data: {
        orgId,
        filters: [
          {
            field: 'customerId',
            op: '=',
            value: customerId,
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Bill.com fetch invoices failed:', error);
    throw new Error(`Failed to fetch invoices: ${error}`);
  }

  const data = await response.json();
  return data.response_data || [];
}

async function syncInvoice(supabase: any, organizationId: string, billcomInvoice: any) {
  const statusMap: Record<string, string> = {
    '0': 'draft',
    '1': 'sent',
    '2': 'viewed',
    '3': 'partial',
    '4': 'paid',
    '5': 'overdue',
    '6': 'void',
  };

  const status = statusMap[billcomInvoice.status] || 'draft';

  const invoiceData = {
    organization_id: organizationId,
    billcom_invoice_id: billcomInvoice.id,
    invoice_number: billcomInvoice.invoiceNumber,
    status,
    amount: parseFloat(billcomInvoice.amount || 0),
    amount_due: parseFloat(billcomInvoice.amountDue || billcomInvoice.amount || 0),
    currency: 'USD',
    issue_date: billcomInvoice.invoiceDate,
    due_date: billcomInvoice.dueDate,
    paid_date: billcomInvoice.paidDate || null,
    description: billcomInvoice.description || null,
    line_items: billcomInvoice.invoiceLineItems || [],
    billcom_payment_link: billcomInvoice.paymentUrl || null,
    billcom_pdf_url: billcomInvoice.pdfUrl || null,
    metadata: { raw_data: billcomInvoice },
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('invoices')
    .upsert(invoiceData, { 
      onConflict: 'billcom_invoice_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error syncing invoice:', billcomInvoice.id, error);
    throw error;
  }

  console.log('Invoice synced:', billcomInvoice.invoiceNumber);
}
