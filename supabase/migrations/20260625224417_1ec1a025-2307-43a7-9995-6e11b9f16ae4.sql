-- Enums
CREATE TYPE public.prospect_status AS ENUM ('new', 'warm', 'cold', 'do_not_contact', 'converted');
CREATE TYPE public.visit_contact_made AS ENUM ('yes', 'no', 'card_only');

-- Prospects table
CREATE TABLE public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status public.prospect_status NOT NULL DEFAULT 'new',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO authenticated;
GRANT ALL ON public.prospects TO service_role;

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all prospects"
  ON public.prospects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sales/agents view all prospects"
  ON public.prospects FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'sales_agent'::app_role)
    OR public.has_role(auth.uid(), 'agent'::app_role)
  );

CREATE POLICY "Sales/agents insert prospects"
  ON public.prospects FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'sales_agent'::app_role)
     OR public.has_role(auth.uid(), 'agent'::app_role))
    AND created_by = auth.uid()
  );

CREATE POLICY "Owners update their prospects"
  ON public.prospects FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (owner_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Owners delete their prospects"
  ON public.prospects FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid());

CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prospects_owner ON public.prospects(owner_id);
CREATE INDEX idx_prospects_status ON public.prospects(status);

-- Prospect visits table
CREATE TABLE public.prospect_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_made public.visit_contact_made NOT NULL DEFAULT 'card_only',
  person_spoken_to TEXT,
  outcome_notes TEXT,
  follow_up_due DATE,
  follow_up_done BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_visits TO authenticated;
GRANT ALL ON public.prospect_visits TO service_role;

ALTER TABLE public.prospect_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all visits"
  ON public.prospect_visits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sales/agents view all visits"
  ON public.prospect_visits FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'sales_agent'::app_role)
    OR public.has_role(auth.uid(), 'agent'::app_role)
  );

CREATE POLICY "Reps create their own visits"
  ON public.prospect_visits FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'sales_agent'::app_role)
     OR public.has_role(auth.uid(), 'agent'::app_role))
    AND created_by = auth.uid()
  );

CREATE POLICY "Reps update their own visits"
  ON public.prospect_visits FOR UPDATE TO authenticated
  USING (rep_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (rep_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Reps delete their own visits"
  ON public.prospect_visits FOR DELETE TO authenticated
  USING (rep_id = auth.uid() OR created_by = auth.uid());

CREATE TRIGGER prospect_visits_updated_at
  BEFORE UPDATE ON public.prospect_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prospect_visits_prospect ON public.prospect_visits(prospect_id);
CREATE INDEX idx_prospect_visits_rep ON public.prospect_visits(rep_id);
CREATE INDEX idx_prospect_visits_followup ON public.prospect_visits(follow_up_due) WHERE follow_up_done = false;

-- Link from deals back to originating prospect
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS prospect_id UUID REFERENCES public.prospects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_deals_prospect ON public.deals(prospect_id);