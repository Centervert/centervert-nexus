-- Create message reactions table for ticket messages
CREATE TABLE IF NOT EXISTS public.ticket_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'thumbs_down', 'heart', 'celebrate', 'thinking')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create message reactions table for opportunity messages
CREATE TABLE IF NOT EXISTS public.opportunity_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES opportunity_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'thumbs_down', 'heart', 'celebrate', 'thinking')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.ticket_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket message reactions
CREATE POLICY "Users can view reactions on accessible messages"
  ON public.ticket_message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ticket_messages tm
      JOIN tickets t ON t.id = tm.ticket_id
      WHERE tm.id = ticket_message_reactions.message_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() 
           OR has_role(auth.uid(), 'admin'::app_role) 
           OR has_role(auth.uid(), 'agent'::app_role))
    )
  );

CREATE POLICY "Users can add reactions to accessible messages"
  ON public.ticket_message_reactions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM ticket_messages tm
      JOIN tickets t ON t.id = tm.ticket_id
      WHERE tm.id = ticket_message_reactions.message_id
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() 
           OR has_role(auth.uid(), 'admin'::app_role) 
           OR has_role(auth.uid(), 'agent'::app_role))
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON public.ticket_message_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS policies for opportunity message reactions
CREATE POLICY "Admins can view all opportunity message reactions"
  ON public.opportunity_message_reactions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can add opportunity message reactions"
  ON public.opportunity_message_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can remove their own opportunity reactions"
  ON public.opportunity_message_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_ticket_message_reactions_message_id ON public.ticket_message_reactions(message_id);
CREATE INDEX idx_opportunity_message_reactions_message_id ON public.opportunity_message_reactions(message_id);

-- Add mentions field to messages for tagging users
ALTER TABLE public.ticket_messages 
ADD COLUMN IF NOT EXISTS mentions UUID[];

ALTER TABLE public.opportunity_messages 
ADD COLUMN IF NOT EXISTS mentions UUID[];