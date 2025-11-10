-- Convert status column to TEXT temporarily
ALTER TABLE opportunities ALTER COLUMN status TYPE TEXT;

-- Drop the old enum type
DROP TYPE IF EXISTS opportunity_status CASCADE;

-- Update existing records to use new status values
UPDATE opportunities SET status = 'working_on_rfp' WHERE status = 'qualified';
UPDATE opportunities SET status = 'submitted' WHERE status = 'proposal_submitted';

-- Create the new enum type with updated values
CREATE TYPE opportunity_status AS ENUM ('lead', 'working_on_rfp', 'submitted', 'awarded', 'lost', 'on_hold');

-- Convert the column back to the enum type
ALTER TABLE opportunities 
  ALTER COLUMN status TYPE opportunity_status USING status::opportunity_status,
  ALTER COLUMN status SET DEFAULT 'lead'::opportunity_status;