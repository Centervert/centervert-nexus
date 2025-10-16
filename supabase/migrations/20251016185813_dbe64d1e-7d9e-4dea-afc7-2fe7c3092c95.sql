-- Create managed_services table
CREATE TABLE public.managed_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  original_ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Service Details
  service_type text NOT NULL,
  service_name text NOT NULL,
  description text,
  
  -- Billing Information
  monthly_amount numeric(10,2) NOT NULL,
  billing_interval text DEFAULT 'monthly',
  
  -- Dates
  billing_start_date timestamptz NOT NULL,
  next_billing_date timestamptz NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'active',
  
  -- Deliverables/Scope
  deliverables text[],
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  cancellation_reason text,
  
  -- Metadata
  notes text
);

-- Indexes
CREATE INDEX idx_managed_services_client ON public.managed_services(client_id);
CREATE INDEX idx_managed_services_ticket ON public.managed_services(original_ticket_id);
CREATE INDEX idx_managed_services_status ON public.managed_services(status);
CREATE INDEX idx_managed_services_next_billing ON public.managed_services(next_billing_date);

-- Enable RLS
ALTER TABLE public.managed_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and agents can manage all services"
ON public.managed_services
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Clients can view their services"
ON public.managed_services
FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER handle_managed_services_updated_at
  BEFORE UPDATE ON public.managed_services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add managed_service_id to tickets table
ALTER TABLE public.tickets ADD COLUMN managed_service_id uuid REFERENCES public.managed_services(id) ON DELETE SET NULL;
CREATE INDEX idx_tickets_managed_service ON public.tickets(managed_service_id);

-- Database Functions
CREATE OR REPLACE FUNCTION public.calculate_billing_start_date(ticket_resolved_at timestamptz)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ticket_resolved_at + INTERVAL '30 days';
$$;

CREATE OR REPLACE FUNCTION public.get_total_mrr()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(monthly_amount), 0)
  FROM managed_services
  WHERE status = 'active';
$$;