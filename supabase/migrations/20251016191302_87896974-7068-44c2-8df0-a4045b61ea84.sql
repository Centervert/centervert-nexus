-- Add Stripe columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

-- Add Stripe columns to ticket_quotes table (for one-time payments)
ALTER TABLE ticket_quotes 
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Add Stripe columns to managed_services table (for subscriptions)
ALTER TABLE managed_services 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
ADD COLUMN IF NOT EXISTS last_payment_amount numeric(10,2);

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer ON clients(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_managed_services_stripe_sub ON managed_services(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_ticket_quotes_stripe_session ON ticket_quotes(stripe_session_id);