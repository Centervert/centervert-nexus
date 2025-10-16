-- Fix search_path for calculate_billing_start_date function
CREATE OR REPLACE FUNCTION public.calculate_billing_start_date(ticket_resolved_at timestamptz)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ticket_resolved_at + INTERVAL '30 days';
$$;