import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote_id, success_url, cancel_url } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get quote and ticket data
    const { data: quote, error: quoteError } = await supabaseClient
      .from('ticket_quotes')
      .select(`
        *,
        ticket:tickets(
          id,
          title,
          ticket_number,
          client_id,
          clients(
            id,
            name,
            stripe_customer_id
          )
        )
      `)
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      throw new Error('Quote not found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const client = quote.ticket.clients;
    let customerId = client.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: client.name,
        metadata: {
          client_id: client.id,
        },
      });
      customerId = customer.id;

      // Update client with Stripe customer ID
      await supabaseClient
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('id', client.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(quote.amount) * 100),
            product_data: {
              name: `Ticket #${quote.ticket.ticket_number}: ${quote.ticket.title}`,
              description: quote.deliverables?.join(', ') || 'Service',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        quote_id: quote_id,
        ticket_id: quote.ticket.id,
      },
    });

    // Update quote with session ID
    await supabaseClient
      .from('ticket_quotes')
      .update({ stripe_session_id: session.id })
      .eq('id', quote_id);

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
