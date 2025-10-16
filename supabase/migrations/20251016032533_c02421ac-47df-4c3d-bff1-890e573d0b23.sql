-- Create ticket_messages table for real-time chat
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_milestones table for timeline tracking
CREATE TABLE IF NOT EXISTS public.ticket_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  person_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_quotes table for pricing information
CREATE TABLE IF NOT EXISTS public.ticket_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_approval',
  approval_window_expires_at TIMESTAMP WITH TIME ZONE,
  po_number TEXT,
  po_file_url TEXT,
  decline_reason TEXT,
  preferred_amount DECIMAL(10, 2),
  deliverables TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_links table for external URLs
CREATE TABLE IF NOT EXISTS public.ticket_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  link_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add ticket_number column to tickets if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tickets' AND column_name = 'ticket_number') THEN
    ALTER TABLE public.tickets ADD COLUMN ticket_number SERIAL;
  END IF;
END $$;

-- Add budget and type columns to tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS budget DECIMAL(10, 2);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS subtype TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages on accessible tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'agent'::app_role)
      )
    )
  );

CREATE POLICY "Users can create messages on accessible tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'agent'::app_role)
      )
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.ticket_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own messages or admins can delete any"
  ON public.ticket_messages FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ticket_milestones
CREATE POLICY "Users can view milestones on accessible tickets"
  ON public.ticket_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_milestones.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'agent'::app_role)
      )
    )
  );

CREATE POLICY "Agents and admins can manage milestones"
  ON public.ticket_milestones FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
  );

-- RLS Policies for ticket_quotes
CREATE POLICY "Users can view quotes on accessible tickets"
  ON public.ticket_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_quotes.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'agent'::app_role)
      )
    )
  );

CREATE POLICY "Agents and admins can create quotes"
  ON public.ticket_quotes FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
  );

CREATE POLICY "Users can update quotes on their tickets"
  ON public.ticket_quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_quotes.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'agent'::app_role)
      )
    )
  );

-- RLS Policies for ticket_links
CREATE POLICY "Users can view links on accessible tickets"
  ON public.ticket_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_links.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'agent'::app_role)
      )
    )
  );

CREATE POLICY "Agents and admins can manage links"
  ON public.ticket_links FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_milestones_ticket_id ON public.ticket_milestones(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_quotes_ticket_id ON public.ticket_quotes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_links_ticket_id ON public.ticket_links(ticket_id);

-- Enable realtime for ticket_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Add triggers for updated_at
CREATE TRIGGER update_ticket_messages_updated_at
  BEFORE UPDATE ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ticket_quotes_updated_at
  BEFORE UPDATE ON public.ticket_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();