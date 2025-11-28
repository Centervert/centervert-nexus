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

    console.log('Starting Bill.com customer sync...');

    // Get Bill.com session
    const session = await getBillComSession();

    // Fetch all customers from Bill.com
    const billcomCustomers = await fetchBillComCustomers(session);
    console.log(`Fetched ${billcomCustomers.length} customers from Bill.com`);

    // Get all organizations without billcom_customer_id
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, billing_email, billcom_customer_id')
      .is('billcom_customer_id', null);

    if (orgsError) throw orgsError;

    let linkedCount = 0;
    let skippedCount = 0;

    // Match organizations to Bill.com customers by billing email
    for (const org of orgs || []) {
      if (!org.billing_email) {
        console.log(`Skipping ${org.name} - no billing email`);
        skippedCount++;
        continue;
      }

      const matchedCustomer = billcomCustomers.find(
        (c: any) => c.email?.toLowerCase() === org.billing_email?.toLowerCase()
      );

      if (matchedCustomer) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ 
            billcom_customer_id: matchedCustomer.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', org.id);

        if (updateError) {
          console.error(`Error linking ${org.name}:`, updateError);
        } else {
          console.log(`✓ Linked ${org.name} to Bill.com customer ${matchedCustomer.name}`);
          linkedCount++;
        }
      } else {
        console.log(`No Bill.com customer found for ${org.name} (${org.billing_email})`);
        skippedCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        totalBillComCustomers: billcomCustomers.length,
        organizationsChecked: orgs?.length || 0,
        linked: linkedCount,
        skipped: skippedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing customers:', error);
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

async function fetchBillComCustomers(session: BillComSession): Promise<any[]> {
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
        // Fetch all active customers
        filters: [
          {
            field: 'isActive',
            op: '=',
            value: '1',
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Bill.com fetch customers failed:', error);
    throw new Error(`Failed to fetch customers: ${error}`);
  }

  const data = await response.json();
  return data.response_data || [];
}
