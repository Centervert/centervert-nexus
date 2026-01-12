-- Create deals table (simplified opportunities)
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id),
  temperature INTEGER NOT NULL DEFAULT 5 CHECK (temperature >= 0 AND temperature <= 10),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  organization_id UUID REFERENCES public.organizations(id),
  contact_id UUID REFERENCES public.contacts(id),
  expected_value NUMERIC,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_messages table for chat
CREATE TABLE public.deal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_attachments table for documents
CREATE TABLE public.deal_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  attachment_type TEXT NOT NULL DEFAULT 'file' CHECK (attachment_type IN ('file', 'link')),
  url TEXT,
  storage_path TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for deals
CREATE POLICY "Admins, agents, and sales agents can manage deals"
  ON public.deals FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'sales_agent'));

CREATE POLICY "Users can view deals they own or created"
  ON public.deals FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'sales_agent') OR owner_id = auth.uid() OR created_by = auth.uid());

-- RLS policies for deal_messages
CREATE POLICY "Admins, agents, and sales agents can manage deal messages"
  ON public.deal_messages FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'sales_agent'));

CREATE POLICY "Users can view messages for deals they have access to"
  ON public.deal_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_messages.deal_id
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'sales_agent') OR d.owner_id = auth.uid() OR d.created_by = auth.uid())
  ));

CREATE POLICY "Users can create messages for deals they have access to"
  ON public.deal_messages FOR INSERT
  WITH CHECK (author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_messages.deal_id
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'sales_agent') OR d.owner_id = auth.uid() OR d.created_by = auth.uid())
  ));

-- RLS policies for deal_attachments
CREATE POLICY "Admins, agents, and sales agents can manage deal attachments"
  ON public.deal_attachments FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'sales_agent'));

CREATE POLICY "Users can view attachments for deals they have access to"
  ON public.deal_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_attachments.deal_id
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'sales_agent') OR d.owner_id = auth.uid() OR d.created_by = auth.uid())
  ));

-- Enable realtime for deal_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_messages;

-- Create updated_at trigger for deals
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();