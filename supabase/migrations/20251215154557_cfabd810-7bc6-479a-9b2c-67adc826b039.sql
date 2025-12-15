-- Create organization_attachments table
CREATE TABLE public.organization_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  attachment_type TEXT,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins, agents, and sales agents can manage
CREATE POLICY "Admins agents sales agents can manage organization attachments"
ON public.organization_attachments
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'sales_agent'::app_role)
);

-- Create storage bucket for organization attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('organization-attachments', 'organization-attachments', false);

-- Storage policies
CREATE POLICY "Admins agents sales agents can upload organization attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-attachments' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'agent'::app_role) OR 
   has_role(auth.uid(), 'sales_agent'::app_role))
);

CREATE POLICY "Admins agents sales agents can view organization attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'organization-attachments' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'agent'::app_role) OR 
   has_role(auth.uid(), 'sales_agent'::app_role))
);

CREATE POLICY "Admins agents sales agents can delete organization attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-attachments' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'agent'::app_role) OR 
   has_role(auth.uid(), 'sales_agent'::app_role))
);