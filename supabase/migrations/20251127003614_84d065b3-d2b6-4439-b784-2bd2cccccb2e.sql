-- Create submission_location_type enum (the other enums already exist)
CREATE TYPE public.submission_location_type AS ENUM ('in_person', 'online', 'other');

-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type opportunity_type NOT NULL,
  status opportunity_status NOT NULL DEFAULT 'lead',
  priority opportunity_priority,
  
  -- Requestor can be contact, organization, or both
  requestor_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  requestor_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  -- Dates
  due_date DATE,
  award_date DATE,
  
  -- Submission location
  submission_location_type submission_location_type,
  submission_address TEXT,
  submission_link TEXT,
  submission_notes TEXT,
  
  -- Ownership and audit
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create opportunity_attachments table for resources
CREATE TABLE public.opportunity_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  attachment_type TEXT, -- 'link', 'rfp', 'supporting_doc', 'file', etc.
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunities
CREATE POLICY "Admins and agents can manage opportunities"
  ON public.opportunities
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

CREATE POLICY "Users can view opportunities they own"
  ON public.opportunities
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'agent') OR 
    owner_id = auth.uid() OR 
    created_by = auth.uid()
  );

-- RLS Policies for attachments
CREATE POLICY "Admins and agents can manage attachments"
  ON public.opportunity_attachments
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

CREATE POLICY "Users can view attachments for opportunities they can see"
  ON public.opportunity_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_attachments.opportunity_id
      AND (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'agent') OR 
        o.owner_id = auth.uid() OR 
        o.created_by = auth.uid()
      )
    )
  );

-- Create indexes
CREATE INDEX idx_opportunities_type ON public.opportunities(type);
CREATE INDEX idx_opportunities_status ON public.opportunities(status);
CREATE INDEX idx_opportunities_owner ON public.opportunities(owner_id);
CREATE INDEX idx_opportunities_requestor_contact ON public.opportunities(requestor_contact_id);
CREATE INDEX idx_opportunities_requestor_org ON public.opportunities(requestor_organization_id);
CREATE INDEX idx_opportunity_attachments_opportunity ON public.opportunity_attachments(opportunity_id);

-- Storage policies (bucket already exists)
CREATE POLICY "Admins and agents can upload opportunity attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'opportunity-attachments' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );

CREATE POLICY "Admins and agents can view opportunity attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'opportunity-attachments' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );

CREATE POLICY "Admins and agents can delete opportunity attachments"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'opportunity-attachments' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );

-- Trigger for updated_at
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();