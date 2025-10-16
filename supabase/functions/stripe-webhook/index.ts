import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const quote_id = session.metadata?.quote_id;
        const ticket_id = session.metadata?.ticket_id;

        if (quote_id) {
          // Update quote to paid
          await supabaseClient
            .from('ticket_quotes')
            .update({
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
              status: 'paid',
            })
            .eq('id', quote_id);

          // Create milestone
          if (ticket_id) {
            await supabaseClient.from('ticket_milestones').insert({
              ticket_id: ticket_id,
              type: 'payment_received',
              title: 'Payment Received',
              description: `Payment of $${(session.amount_total || 0) / 100} received via Stripe`,
              status: 'completed',
            });
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription_id = invoice.subscription as string;

        if (subscription_id) {
          // Find managed service
          const { data: service } = await supabaseClient
            .from('managed_services')
            .select('id, ticket_id')
            .eq('stripe_subscription_id', subscription_id)
            .single();

          if (service) {
            // Update last payment info
            await supabaseClient
              .from('managed_services')
              .update({
                last_payment_date: new Date().toISOString(),
                last_payment_amount: (invoice.amount_paid || 0) / 100,
                next_billing_date: new Date((invoice.lines.data[0]?.period?.end || 0) * 1000).toISOString(),
              })
              .eq('id', service.id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription_id = invoice.subscription as string;

        if (subscription_id) {
          const { data: service } = await supabaseClient
            .from('managed_services')
            .select('id, client_id')
            .eq('stripe_subscription_id', subscription_id)
            .single();

          if (service) {
            // Update service status
            await supabaseClient
              .from('managed_services')
              .update({ status: 'paused', notes: 'Payment failed - requires attention' })
              .eq('id', service.id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseClient
          .from('managed_services')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Cancelled via Stripe',
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        
        if (item) {
          await supabaseClient
            .from('managed_services')
            .update({
              monthly_amount: (item.price.unit_amount || 0) / 100,
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
