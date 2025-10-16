-- Create client_type enum
CREATE TYPE public.client_type AS ENUM ('direct', 'agency', 'agency_managed');

-- Create access_level enum for client users
CREATE TYPE public.client_access_level AS ENUM ('admin', 'member', 'viewer');

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_type public.client_type NOT NULL DEFAULT 'direct',
  payment_terms TEXT,
  payment_terms_days INTEGER,
  managing_agency_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  billing_address TEXT,
  shipping_address TEXT,
  tax_id TEXT,
  website TEXT,
  phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client_contacts table
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_billing BOOLEAN DEFAULT false,
  is_technical BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client_users table
CREATE TABLE public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level public.client_access_level NOT NULL DEFAULT 'member',
  can_create_tickets BOOLEAN DEFAULT true,
  can_approve_quotes BOOLEAN DEFAULT false,
  can_view_invoices BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  invited_by UUID REFERENCES public.profiles(id),
  UNIQUE(client_id, user_id)
);

-- Add client_id to profiles
ALTER TABLE public.profiles ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add client_id to tickets
ALTER TABLE public.tickets ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add client_id to ticket_quotes
ALTER TABLE public.ticket_quotes ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Admins can manage all clients"
  ON public.clients
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agency users can view and manage their clients"
  ON public.clients
  FOR SELECT
  USING (
    has_role(auth.uid(), 'agent'::app_role) OR
    (managing_agency_id IN (
      SELECT client_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can view their own client"
  ON public.clients
  FOR SELECT
  USING (
    id IN (SELECT client_id FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for client_contacts table
CREATE POLICY "Admins can manage all contacts"
  ON public.client_contacts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view contacts for their client"
  ON public.client_contacts
  FOR SELECT
  USING (
    client_id IN (SELECT client_id FROM public.profiles WHERE id = auth.uid()) OR
    has_role(auth.uid(), 'agent'::app_role)
  );

-- RLS Policies for client_users table
CREATE POLICY "Admins can manage all client users"
  ON public.client_users
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view client users for their client"
  ON public.client_users
  FOR SELECT
  USING (
    client_id IN (SELECT client_id FROM public.profiles WHERE id = auth.uid()) OR
    has_role(auth.uid(), 'agent'::app_role)
  );

-- Create trigger for updated_at on clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on client_contacts
CREATE TRIGGER update_client_contacts_updated_at
  BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better query performance
CREATE INDEX idx_clients_managing_agency ON public.clients(managing_agency_id);
CREATE INDEX idx_clients_is_active ON public.clients(is_active);
CREATE INDEX idx_client_contacts_client_id ON public.client_contacts(client_id);
CREATE INDEX idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX idx_client_users_user_id ON public.client_users(user_id);
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX idx_ticket_quotes_client_id ON public.ticket_quotes(client_id);