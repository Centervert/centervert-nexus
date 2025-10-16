-- Add recurring billing fields to ticket_quotes table
ALTER TABLE ticket_quotes 
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN billing_interval TEXT CHECK (billing_interval IN ('monthly', 'quarterly', 'annually')),
ADD COLUMN billing_cycles INTEGER CHECK (billing_cycles > 0);