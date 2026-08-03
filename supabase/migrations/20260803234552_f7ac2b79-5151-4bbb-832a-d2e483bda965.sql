-- ============ 1. Stage enum swap ============
CREATE TYPE public.deal_stage_new AS ENUM (
  'discovery','qualified','solution_fit','preferred_vendor','commercial','commit','won','lost','on_hold'
);

ALTER TABLE public.deals ALTER COLUMN stage DROP DEFAULT;

DROP TRIGGER IF EXISTS trg_sync_deal_status ON public.deals;

ALTER TABLE public.deals
  ALTER COLUMN stage TYPE public.deal_stage_new
  USING (CASE stage::text
    WHEN 'new' THEN 'discovery'
    WHEN 'qualifying' THEN 'qualified'
    WHEN 'proposal' THEN 'solution_fit'
    WHEN 'negotiation' THEN 'commercial'
    WHEN 'won' THEN 'won'
    WHEN 'lost' THEN 'lost'
    WHEN 'on_hold' THEN 'on_hold'
    ELSE 'discovery'
  END)::public.deal_stage_new;

ALTER TABLE public.deals ALTER COLUMN stage SET DEFAULT 'discovery'::public.deal_stage_new;

DROP TYPE public.deal_stage;
ALTER TYPE public.deal_stage_new RENAME TO deal_stage;

CREATE TRIGGER trg_sync_deal_status
BEFORE INSERT OR UPDATE OF stage ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.sync_deal_status_from_stage();

-- ============ 2. Deal columns ============
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS methodology_profile text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS why_change text,
  ADD COLUMN IF NOT EXISTS why_now text,
  ADD COLUMN IF NOT EXISTS why_us text,
  ADD COLUMN IF NOT EXISTS qualification_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS critical_gap_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forecast_category text NOT NULL DEFAULT 'pipeline',
  ADD COLUMN IF NOT EXISTS target_decision_date date,
  ADD COLUMN IF NOT EXISTS target_signature_date date,
  ADD COLUMN IF NOT EXISTS close_date date,
  ADD COLUMN IF NOT EXISTS compelling_event text,
  ADD COLUMN IF NOT EXISTS compelling_event_date date,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS next_action_owner text,
  ADD COLUMN IF NOT EXISTS next_action_due_at date,
  ADD COLUMN IF NOT EXISTS gate_override_reason text,
  ADD COLUMN IF NOT EXISTS win_reason text,
  ADD COLUMN IF NOT EXISTS loss_type text,
  ADD COLUMN IF NOT EXISTS actual_winner text;

-- ============ 3. Access helper ============
CREATE OR REPLACE FUNCTION public.can_access_deal(_deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = _deal_id
      AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'agent')
        OR public.has_role(auth.uid(), 'sales_agent')
        OR d.owner_id = auth.uid()
        OR d.created_by = auth.uid()
      )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_deal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_deal(uuid) TO authenticated;

-- ============ 4. Tables ============
CREATE TABLE public.deal_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  element text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 4),
  summary text,
  last_verified_at timestamptz,
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, element)
);

CREATE TABLE public.deal_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  element text,
  note text NOT NULL,
  source text,
  source_url text,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  confirmed_by text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  name text NOT NULL,
  title text,
  role text NOT NULL DEFAULT 'influencer',
  authority text NOT NULL DEFAULT 'unknown',
  influence text NOT NULL DEFAULT 'medium',
  stance text NOT NULL DEFAULT 'neutral',
  relationship_strength text NOT NULL DEFAULT 'unknown',
  last_engaged_on date,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name text NOT NULL,
  baseline text,
  target text,
  unit text,
  timeframe text,
  owner_name text,
  validated boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_pains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  description text NOT NULL,
  level text NOT NULL DEFAULT 'operational',
  impact text,
  consequence text,
  owner_name text,
  buyer_owned boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  criterion text NOT NULL,
  category text NOT NULL DEFAULT 'technical',
  weight integer NOT NULL DEFAULT 3,
  must_have boolean NOT NULL DEFAULT false,
  our_position text NOT NULL DEFAULT 'unknown',
  resolved boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'decision',
  sequence integer NOT NULL DEFAULT 0,
  owner_name text,
  due_date date,
  status text NOT NULL DEFAULT 'not_started',
  confirmed_by_buyer boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name text NOT NULL,
  competitor_type text NOT NULL DEFAULT 'vendor',
  position text NOT NULL DEFAULT 'unknown',
  strengths text,
  weaknesses text,
  our_strategy text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  probability text NOT NULL DEFAULT 'medium',
  mitigation text,
  owner_name text,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_next_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  description text NOT NULL,
  owner_side text NOT NULL DEFAULT 'seller',
  owner_name text,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  unmet_gates jsonb NOT NULL DEFAULT '[]'::jsonb,
  override_reason text,
  changed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_score_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  stage text,
  total_score integer NOT NULL DEFAULT 0,
  critical_gap_count integer NOT NULL DEFAULT 0,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ 5. Grants, RLS, policies ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'deal_elements','deal_evidence','deal_stakeholders','deal_metrics','deal_pains',
    'deal_criteria','deal_process_steps','deal_competitors','deal_risks','deal_next_actions',
    'deal_stage_history','deal_score_snapshots'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Deal access can manage %1$s" ON public.%1$I FOR ALL TO authenticated
         USING (public.can_access_deal(deal_id)) WITH CHECK (public.can_access_deal(deal_id))', t);
    EXECUTE format('CREATE INDEX idx_%1$s_deal ON public.%1$I(deal_id)', t);
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.log_audit_event()', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'deal_elements','deal_evidence','deal_stakeholders','deal_metrics','deal_pains',
    'deal_criteria','deal_process_steps','deal_competitors','deal_risks','deal_next_actions'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;