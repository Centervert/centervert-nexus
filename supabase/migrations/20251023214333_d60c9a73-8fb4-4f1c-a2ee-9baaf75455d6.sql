-- Add constraint to prevent end_client_name without client_id
-- This ensures tickets always have a proper client relationship when end_client_name is specified

ALTER TABLE tickets 
ADD CONSTRAINT check_end_client_requires_client 
CHECK (
  end_client_name IS NULL OR client_id IS NOT NULL
);