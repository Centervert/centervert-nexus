import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const validateInput = (data: any) => {
  if (!data.quote_id || typeof data.quote_id !== 'string') {
    throw new Error('Invalid quote_id');
  }
  if (!data.success_url || typeof data.success_url !== 'string' || !data.success_url.startsWith('http')) {
    throw new Error('Invalid success_url');
  }
  if (!data.cancel_url || typeof data.cancel_url !== 'string' || !data.cancel_url.startsWith('http')) {
    throw new Error('Invalid cancel_url');
  }
  if (data.success_url.length > 2048 || data.cancel_url.length > 2048) {
    throw new Error('URL too long');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const rawInput = await req.json();
    validateInput(rawInput);
    
    const { quote_id, success_url, cancel_url } = rawInput;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

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
      return new Response(JSON.stringify({ error: 'Quote not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Verify user has access to this quote's client
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('client_id')
      .eq('id', user.id)
      .single();

    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    const isAgent = userRoles?.some(r => r.role === 'agent');

    if (!isAdmin && !isAgent && userProfile?.client_id !== quote.ticket.clients.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
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
    
    // Return generic error message to user, log details server-side
    let userMessage = 'Unable to create checkout session';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid')) {
        userMessage = 'Invalid request data';
        statusCode = 400;
      } else if (error.message.includes('not found')) {
        userMessage = 'Resource not found';
        statusCode = 404;
      }
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});
