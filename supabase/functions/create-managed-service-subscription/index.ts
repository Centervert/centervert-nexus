import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateInput = (data: any) => {
  if (!data.managed_service_id || typeof data.managed_service_id !== 'string') {
    throw new Error('Invalid managed_service_id');
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
    
    const { managed_service_id } = rawInput;

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

    // Check user has admin or agent role
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    const isAgent = userRoles?.some(r => r.role === 'agent');

    if (!isAdmin && !isAgent) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Get managed service data
    const { data: service, error: serviceError } = await supabaseClient
      .from('managed_services')
      .select(`
        *,
        client:clients(
          id,
          name,
          stripe_customer_id
        )
      `)
      .eq('id', managed_service_id)
      .single();

    if (serviceError || !service) {
      return new Response(JSON.stringify({ error: 'Service not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const client = service.client;
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

      await supabaseClient
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('id', client.id);
    }

    // Create Stripe product
    const product = await stripe.products.create({
      name: service.service_name,
      description: service.description || undefined,
      metadata: {
        managed_service_id: service.id,
        client_id: client.id,
      },
    });

    // Map billing interval to Stripe format
    const intervalMap: Record<string, { interval: Stripe.Price.Recurring.Interval; interval_count: number }> = {
      monthly: { interval: 'month', interval_count: 1 },
      quarterly: { interval: 'month', interval_count: 3 },
      annually: { interval: 'year', interval_count: 1 },
    };

    const intervalConfig = intervalMap[service.billing_interval] || intervalMap.monthly;

    // Create Stripe price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(Number(service.monthly_amount) * 100),
      currency: 'usd',
      recurring: {
        interval: intervalConfig.interval,
        interval_count: intervalConfig.interval_count,
      },
    });

    // Calculate trial end (billing start date)
    const trialEnd = Math.floor(new Date(service.billing_start_date).getTime() / 1000);

    // Create subscription with trial period
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      trial_end: trialEnd > Math.floor(Date.now() / 1000) ? trialEnd : undefined,
      metadata: {
        managed_service_id: service.id,
      },
    });

    // Update managed service with Stripe IDs
    await supabaseClient
      .from('managed_services')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_product_id: product.id,
        stripe_price_id: price.id,
      })
      .eq('id', service.id);

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        product_id: product.id,
        price_id: price.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating managed service subscription:', error);
    
    // Return generic error message to user, log details server-side
    let userMessage = 'Unable to create subscription';
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
