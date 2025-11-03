-- Create table to track when users last read ticket messages
CREATE TABLE ticket_message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);

-- Create table to track when users last read opportunity messages
CREATE TABLE opportunity_message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, user_id)
);

-- Enable RLS
ALTER TABLE ticket_message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_message_read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_message_read_receipts
CREATE POLICY "Users can view their own read receipts"
  ON ticket_message_read_receipts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own read receipts"
  ON ticket_message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own read receipts"
  ON ticket_message_read_receipts FOR UPDATE
  USING (user_id = auth.uid());

-- RLS policies for opportunity_message_read_receipts
CREATE POLICY "Users can view their own read receipts"
  ON opportunity_message_read_receipts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own read receipts"
  ON opportunity_message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own read receipts"
  ON opportunity_message_read_receipts FOR UPDATE
  USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_ticket_read_receipts_ticket_user ON ticket_message_read_receipts(ticket_id, user_id);
CREATE INDEX idx_opportunity_read_receipts_opportunity_user ON opportunity_message_read_receipts(opportunity_id, user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_ticket_read_receipts_updated_at
  BEFORE UPDATE ON ticket_message_read_receipts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_opportunity_read_receipts_updated_at
  BEFORE UPDATE ON opportunity_message_read_receipts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();