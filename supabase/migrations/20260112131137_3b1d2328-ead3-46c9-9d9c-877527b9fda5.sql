-- Create reactions table for deal messages
CREATE TABLE public.deal_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.deal_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.deal_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all reactions for messages they can access
CREATE POLICY "Users can view reactions for accessible messages"
ON public.deal_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deal_messages dm
    JOIN deals d ON d.id = dm.deal_id
    WHERE dm.id = deal_message_reactions.message_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'agent'::app_role) OR
      has_role(auth.uid(), 'sales_agent'::app_role) OR
      d.owner_id = auth.uid() OR
      d.created_by = auth.uid()
    )
  )
);

-- Policy: Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
ON public.deal_message_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.deal_message_reactions
FOR DELETE
USING (auth.uid() = user_id);