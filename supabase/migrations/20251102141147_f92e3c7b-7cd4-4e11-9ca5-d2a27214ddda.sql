-- Add parent ticket relationship to tickets table
ALTER TABLE tickets 
ADD COLUMN parent_ticket_id uuid REFERENCES tickets(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_tickets_parent_ticket_id ON tickets(parent_ticket_id);

-- Add comment for documentation
COMMENT ON COLUMN tickets.parent_ticket_id IS 'Reference to parent ticket if this is a child ticket';