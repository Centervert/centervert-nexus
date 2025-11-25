-- Add auto_payment_enabled field to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS auto_payment_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN clients.auto_payment_enabled IS 'Whether the client has automatic payment enabled for invoices';

-- Create index for faster queries on auto_payment_enabled
CREATE INDEX IF NOT EXISTS idx_clients_auto_payment_enabled ON clients(auto_payment_enabled) WHERE auto_payment_enabled = true;