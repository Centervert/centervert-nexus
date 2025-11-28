import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Bill.com webhook received:', JSON.stringify(payload, null, 2));

    const eventType = payload.eventType || payload.event_type;
    const eventData = payload.data || payload;

    // Handle different event types
    switch (eventType) {
      case 'invoice.created':
      case 'invoice.updated':
      case 'invoice.sent':
      case 'invoice.viewed':
        await handleInvoiceEvent(supabase, eventData);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(supabase, eventData);
        break;

      case 'payment.created':
      case 'payment.updated':
        await handlePaymentEvent(supabase, eventData);
        break;

      case 'customer.created':
      case 'customer.updated':
        await handleCustomerEvent(supabase, eventData);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return new Response(
      JSON.stringify({ success: true, eventType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
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

async function handleInvoiceEvent(supabase: any, data: any) {
  const invoice = data.invoice || data;
  
  // Map Bill.com status to local status
  const statusMap: Record<string, string> = {
    'Draft': 'draft',
    'Sent': 'sent',
    'Viewed': 'viewed',
    'PartiallyPaid': 'partial',
    'Paid': 'paid',
    'Overdue': 'overdue',
    'Voided': 'void',
  };

  const status = statusMap[invoice.status] || 'draft';

  // Find organization by billcom_customer_id
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('billcom_customer_id', invoice.customerId)
    .maybeSingle();

  if (!org) {
    console.error('Organization not found for Bill.com customer:', invoice.customerId);
    return;
  }

  const invoiceData = {
    organization_id: org.id,
    billcom_invoice_id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    status,
    amount: parseFloat(invoice.amount || 0),
    amount_due: parseFloat(invoice.amountDue || invoice.amount || 0),
    currency: invoice.currency || 'USD',
    issue_date: invoice.invoiceDate,
    due_date: invoice.dueDate,
    paid_date: invoice.paidDate || null,
    description: invoice.description || null,
    line_items: invoice.lineItems || [],
    billcom_payment_link: invoice.paymentLink || null,
    billcom_pdf_url: invoice.pdfUrl || null,
    metadata: { raw_data: invoice },
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Upsert invoice
  const { error } = await supabase
    .from('invoices')
    .upsert(invoiceData, { 
      onConflict: 'billcom_invoice_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error upserting invoice:', error);
    throw error;
  }

  console.log('Invoice synced successfully:', invoice.id);
}

async function handleInvoicePaid(supabase: any, data: any) {
  // First update the invoice
  await handleInvoiceEvent(supabase, data);
  
  // Then record the payment
  const invoice = data.invoice || data;
  const payment = data.payment || {};

  const { data: localInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('billcom_invoice_id', invoice.id)
    .single();

  if (localInvoice && payment.id) {
    await supabase.from('payments').upsert({
      invoice_id: localInvoice.id,
      billcom_payment_id: payment.id,
      amount: parseFloat(payment.amount || invoice.amount),
      payment_date: payment.paymentDate || new Date().toISOString(),
      payment_method: payment.paymentMethod || 'Unknown',
      status: 'completed',
      metadata: { raw_data: payment },
    }, { onConflict: 'billcom_payment_id' });
  }
}

async function handlePaymentEvent(supabase: any, data: any) {
  const payment = data.payment || data;

  // Find invoice by Bill.com invoice ID
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('billcom_invoice_id', payment.invoiceId)
    .maybeSingle();

  if (!invoice) {
    console.error('Invoice not found for payment:', payment.invoiceId);
    return;
  }

  const paymentData = {
    invoice_id: invoice.id,
    billcom_payment_id: payment.id,
    amount: parseFloat(payment.amount),
    payment_date: payment.paymentDate || new Date().toISOString(),
    payment_method: payment.paymentMethod || 'Unknown',
    status: payment.status || 'completed',
    metadata: { raw_data: payment },
  };

  const { error } = await supabase
    .from('payments')
    .upsert(paymentData, { onConflict: 'billcom_payment_id' });

  if (error) {
    console.error('Error upserting payment:', error);
    throw error;
  }

  console.log('Payment synced successfully:', payment.id);
}

async function handleCustomerEvent(supabase: any, data: any) {
  const customer = data.customer || data;

  // Update organization with Bill.com customer ID
  const { error } = await supabase
    .from('organizations')
    .update({ 
      billcom_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq('billing_email', customer.email)
    .is('billcom_customer_id', null);

  if (error) {
    console.error('Error updating organization with customer ID:', error);
  } else {
    console.log('Organization linked to Bill.com customer:', customer.id);
  }
}
