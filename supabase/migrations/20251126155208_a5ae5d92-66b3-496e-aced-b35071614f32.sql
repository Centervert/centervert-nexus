-- Create companies table (HubSpot-style accounts)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  billing_email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  notes TEXT,
  billcom_customer_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contacts table (people associated with companies)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Rename client_id to company_id in profiles table
ALTER TABLE public.profiles 
  RENAME COLUMN client_id TO company_id;

-- Rename client_id to company_id in tickets table
ALTER TABLE public.tickets 
  RENAME COLUMN client_id TO company_id;

-- Rename client_id to company_id in ticket_quotes table
ALTER TABLE public.ticket_quotes 
  RENAME COLUMN client_id TO company_id;

-- Rename client_id to company_id in invitations table
ALTER TABLE public.invitations 
  RENAME COLUMN client_id TO company_id;

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admins and agents can manage all companies
CREATE POLICY "Admins and agents can manage companies"
  ON public.companies
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- Client users can view their own company
CREATE POLICY "Client users can view their own company"
  ON public.companies
  FOR SELECT
  USING (
    has_role(auth.uid(), 'user') AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = companies.id
    )
  );

-- Enable RLS on contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Admins and agents can manage all contacts
CREATE POLICY "Admins and agents can manage contacts"
  ON public.contacts
  FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- Client users can view contacts in their company
CREATE POLICY "Client users can view their company contacts"
  ON public.contacts
  FOR SELECT
  USING (
    has_role(auth.uid(), 'user') AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = contacts.company_id
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add missing SELECT policies for tickets and ticket_quotes so users can view them
CREATE POLICY "Users can view accessible tickets"
  ON public.tickets
  FOR SELECT
  USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'agent') OR
    (has_role(auth.uid(), 'user') AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = tickets.company_id
    ))
  );

CREATE POLICY "Users can view accessible quotes"
  ON public.ticket_quotes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_quotes.ticket_id 
      AND (
        tickets.created_by = auth.uid() OR 
        tickets.assigned_to = auth.uid() OR 
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'agent') OR
        (has_role(auth.uid(), 'user') AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.company_id = tickets.company_id
        ))
      )
    )
  );

CREATE POLICY "Admins and agents can update quotes"
  ON public.ticket_quotes
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- Add missing policies for ticket_messages
CREATE POLICY "Users can view accessible ticket messages"
  ON public.ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (
        tickets.created_by = auth.uid() OR 
        tickets.assigned_to = auth.uid() OR 
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'agent') OR
        (has_role(auth.uid(), 'user') AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.company_id = tickets.company_id
        ))
      )
    )
  );

CREATE POLICY "Users can create messages on accessible tickets"
  ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (
        tickets.created_by = auth.uid() OR 
        tickets.assigned_to = auth.uid() OR 
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'agent') OR
        (has_role(auth.uid(), 'user') AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.company_id = tickets.company_id
        ))
      )
    )
  );