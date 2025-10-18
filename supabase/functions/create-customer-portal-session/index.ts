import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateInput = (data: any) => {
  if (!data.client_id || typeof data.client_id !== 'string') {
    throw new Error('Invalid client_id');
  }
  if (!data.return_url || typeof data.return_url !== 'string' || !data.return_url.startsWith('http')) {
    throw new Error('Invalid return_url');
  }
  if (data.return_url.length > 2048) {
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
    
    const { client_id, return_url } = rawInput;

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

    // Verify user has access to this client
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

    if (!isAdmin && !isAgent && userProfile?.client_id !== client_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', client_id)
      .single();

    if (clientError || !client?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: return_url,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating portal session:', error);
    
    // Return generic error message to user, log details server-side
    let userMessage = 'Unable to create portal session';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid')) {
        userMessage = 'Invalid request data';
        statusCode = 400;
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
