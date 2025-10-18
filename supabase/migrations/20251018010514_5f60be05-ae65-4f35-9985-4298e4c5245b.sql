-- Add formatting and important message support to ticket_messages
ALTER TABLE ticket_messages
ADD COLUMN format text DEFAULT 'plain',
ADD COLUMN is_important boolean DEFAULT false,
ADD COLUMN marked_important_at timestamp with time zone,
ADD COLUMN marked_important_by uuid REFERENCES auth.users(id);

-- Enable full row replication for realtime updates
ALTER TABLE ticket_messages REPLICA IDENTITY FULL;

-- Update RLS policy to allow agents/admins to mark messages as important
DROP POLICY IF EXISTS "Users can update own messages" ON ticket_messages;

CREATE POLICY "Users can update own messages or admins/agents can mark important"
ON ticket_messages
FOR UPDATE
USING (
  user_id = auth.uid() 
  OR (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'agent'::app_role)
  )
);