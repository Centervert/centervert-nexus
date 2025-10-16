-- Add end_client_name field to tickets table
ALTER TABLE tickets ADD COLUMN end_client_name text;

-- Add a comment to explain the field
COMMENT ON COLUMN tickets.end_client_name IS 'The end client name for agency-managed clients';