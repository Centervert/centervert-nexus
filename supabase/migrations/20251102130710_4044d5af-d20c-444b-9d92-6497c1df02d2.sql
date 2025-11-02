-- Create enums for opportunities
CREATE TYPE opportunity_type AS ENUM ('private', 'government');
CREATE TYPE opportunity_status AS ENUM ('lead', 'qualified', 'proposal_submitted', 'awarded', 'lost', 'on_hold');
CREATE TYPE opportunity_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  opportunity_type opportunity_type NOT NULL DEFAULT 'private',
  status opportunity_status NOT NULL DEFAULT 'lead',
  priority opportunity_priority NOT NULL DEFAULT 'medium',
  estimated_value NUMERIC,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Government-specific fields
  issuing_organization TEXT,
  rfp_number TEXT,
  procurement_officer_name TEXT,
  procurement_officer_email TEXT,
  procurement_officer_phone TEXT,
  submission_url TEXT,
  submission_address TEXT,
  conference_date TIMESTAMP WITH TIME ZONE,
  conference_type TEXT,
  conference_location TEXT,
  conference_link TEXT,
  
  -- Important dates
  issue_date DATE,
  questions_deadline TIMESTAMP WITH TIME ZONE,
  submission_deadline TIMESTAMP WITH TIME ZONE,
  award_date DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  organization TEXT,
  contact_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunity_contacts junction table
CREATE TABLE public.opportunity_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, contact_id)
);

-- Create opportunity_messages table
CREATE TABLE public.opportunity_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  format TEXT DEFAULT 'plain',
  is_important BOOLEAN DEFAULT FALSE,
  marked_important_at TIMESTAMP WITH TIME ZONE,
  marked_important_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunity_attachments table
CREATE TABLE public.opportunity_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for opportunity attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('opportunity-attachments', 'opportunity-attachments', false);

-- Enable RLS on all tables
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunities (admin-only)
CREATE POLICY "Admins can manage all opportunities"
ON public.opportunities
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for contacts (admin-only)
CREATE POLICY "Admins can manage all contacts"
ON public.contacts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for opportunity_contacts (admin-only)
CREATE POLICY "Admins can manage opportunity contacts"
ON public.opportunity_contacts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for opportunity_messages (admin-only)
CREATE POLICY "Admins can manage opportunity messages"
ON public.opportunity_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for opportunity_attachments (admin-only)
CREATE POLICY "Admins can manage opportunity attachments"
ON public.opportunity_attachments
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Storage policies for opportunity-attachments bucket
CREATE POLICY "Admins can upload opportunity attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'opportunity-attachments' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can view opportunity attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'opportunity-attachments' AND
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete opportunity attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'opportunity-attachments' AND
  has_role(auth.uid(), 'admin')
);

-- Function to auto-generate opportunity numbers
CREATE OR REPLACE FUNCTION generate_opportunity_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  new_number TEXT;
BEGIN
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(opportunity_number FROM 'OPP-(\d+)') AS INTEGER
      )
    ), 0
  ) + 1 INTO next_num
  FROM opportunities;
  
  new_number := 'OPP-' || LPAD(next_num::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

-- Trigger to auto-set opportunity_number on insert
CREATE OR REPLACE FUNCTION set_opportunity_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.opportunity_number IS NULL OR NEW.opportunity_number = '' THEN
    NEW.opportunity_number := generate_opportunity_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_opportunity_number
BEFORE INSERT ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION set_opportunity_number();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_opportunity_messages_updated_at
BEFORE UPDATE ON public.opportunity_messages
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();