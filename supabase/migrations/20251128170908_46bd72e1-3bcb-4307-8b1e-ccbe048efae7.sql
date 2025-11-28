-- Add missing columns to opportunities table for CSV import
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS opportunity_number TEXT,
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;

-- Add index for opportunity number lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_number ON opportunities(opportunity_number);