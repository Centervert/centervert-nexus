-- Add approved_by field to ticket_quotes table
ALTER TABLE ticket_quotes 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);

-- Add approved_at field to track when it was approved
ALTER TABLE ticket_quotes 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;