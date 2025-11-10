-- Create table for opportunity document links
CREATE TABLE public.opportunity_document_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.opportunity_document_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage opportunity document links"
  ON public.opportunity_document_links
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_opportunity_document_links_updated_at
  BEFORE UPDATE ON public.opportunity_document_links
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();