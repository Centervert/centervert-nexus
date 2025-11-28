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

    const body = await req.json();
    const organizationId = body?.organization_id;

    let organizations: any[] = [];

    if (organizationId) {
      // Sync specific organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError || !org) {
        throw new Error('Organization not found');
      }

      if (!org.billcom_customer_id) {
        throw new Error('Organization not linked to Bill.com customer');
      }

      organizations = [org];
    } else {
      // Sync ALL organizations with Bill.com customer IDs
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .not('billcom_customer_id', 'is', null);

      if (orgsError) throw orgsError;
      organizations = orgs || [];
      
      console.log(`Found ${organizations.length} organizations with Bill.com customer IDs`);
    }

    if (organizations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          syncedCount: 0,
          message: 'No organizations linked to Bill.com customers'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Bill.com session once for all organizations
    const session = await getBillComSession();

    let totalSyncedCount = 0;
    const results: any[] = [];

    // Sync invoices for each organization
    for (const org of organizations) {
      try {
        console.log(`Syncing invoices for ${org.name} (${org.billcom_customer_id})`);
        
        const invoices = await fetchBillComInvoices(session, org.billcom_customer_id);
        
        let orgSyncedCount = 0;
        for (const invoice of invoices) {
          await syncInvoice(supabase, org.id, invoice);
          orgSyncedCount++;
        }

        totalSyncedCount += orgSyncedCount;
        results.push({
          organization: org.name,
          syncedCount: orgSyncedCount,
        });

        // Create activity log for successful sync
        if (orgSyncedCount > 0) {
          await supabase.rpc('create_billcom_sync_log', {
            p_organization_id: org.id,
            p_activity_type: 'sync_completed',
            p_message: `Synced ${orgSyncedCount} invoice${orgSyncedCount !== 1 ? 's' : ''} from Bill.com`,
            p_metadata: {
              invoice_count: orgSyncedCount,
              billcom_customer_id: org.billcom_customer_id,
            },
          });
        }

        console.log(`✓ Synced ${orgSyncedCount} invoices for ${org.name}`);
      } catch (error) {
        console.error(`Error syncing ${org.name}:`, error);
        
        // Create activity log for failed sync
        const { error: logError } = await supabase.rpc('create_billcom_sync_log', {
          p_organization_id: org.id,
          p_activity_type: 'sync_failed',
          p_message: `Failed to sync invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
          p_metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            billcom_customer_id: org.billcom_customer_id,
          },
        });
        
        if (logError) {
          console.error('Error creating log:', logError);
        }
        
        results.push({
          organization: org.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalSyncedCount,
        organizationsProcessed: organizations.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalSyncedCount,
        organizationsProcessed: organizations.length,
        results,
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

async function findOrganizationForInvoice(
  supabase: any,
  session: BillComSession,
  billcomInvoice: any
): Promise<string | null> {
  const customerId = billcomInvoice.customerId;
  
  // First, try to find organization by billcom_customer_id
  const { data: orgById } = await supabase
    .from('organizations')
    .select('id')
    .eq('billcom_customer_id', customerId)
    .maybeSingle();

  if (orgById) {
    return orgById.id;
  }

  // If not found, try to match by billing email
  console.log(`No organization found with billcom_customer_id ${customerId}, attempting email match...`);
  
  // Fetch the customer details from Bill.com to get their email
  const customer = await fetchBillComCustomer(session, customerId);
  
  if (!customer || !customer.email) {
    console.log(`Could not fetch customer email for ${customerId}`);
    return null;
  }

  // Find organization by billing email
  const { data: orgByEmail } = await supabase
    .from('organizations')
    .select('id, name, billcom_customer_id')
    .ilike('billing_email', customer.email)
    .maybeSingle();

  if (orgByEmail) {
    // Auto-link by setting billcom_customer_id
    if (!orgByEmail.billcom_customer_id) {
      console.log(`✓ Auto-linking ${orgByEmail.name} to Bill.com customer ${customerId} via email match`);
      
      await supabase
        .from('organizations')
        .update({ 
          billcom_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgByEmail.id);
      
      // Create activity log for auto-link
      const { error: logError } = await supabase.rpc('create_billcom_sync_log', {
        p_organization_id: orgByEmail.id,
        p_activity_type: 'customer_auto_linked',
        p_message: `Auto-linked to Bill.com customer via email match`,
        p_metadata: {
          billcom_customer_id: customerId,
          customer_email: customer.email,
          matched_by: 'email',
        },
      });
      
      if (logError) {
        console.error('Error creating log:', logError);
      }
    }
    
    return orgByEmail.id;
  }

  console.log(`No organization found for Bill.com customer ${customerId} (${customer.email})`);
  return null;
}

async function fetchBillComCustomer(session: BillComSession, customerId: string): Promise<any> {
  const devKey = Deno.env.get('BILLCOM_DEV_KEY')!;
  const orgId = Deno.env.get('BILLCOM_ORG_ID')!;

  const response = await fetch('https://api.bill.com/api/v3/Crud/Read/Customer.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      devKey,
      sessionId: session.sessionId,
      data: {
        orgId,
        id: customerId,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Bill.com fetch customer failed:', error);
    return null;
  }

  const data = await response.json();
  return data.response_data;
}
