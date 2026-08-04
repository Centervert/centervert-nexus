-- ACTIVITIES ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL DEFAULT 'note',
  subject text,
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  project_id uuid,
  person_spoken_to text,
  outcome text,
  interest_level text,
  left_behind text,
  follow_up_on date,
  follow_up_done boolean NOT NULL DEFAULT false,
  attachment_url text,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all activities" ON public.activities
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales and agents view activities" ON public.activities
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role));

CREATE POLICY "Sales and agents insert activities" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role)) AND created_by = auth.uid());

CREATE POLICY "Owners update their activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (owner_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Owners delete their activities" ON public.activities
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid());

CREATE INDEX IF NOT EXISTS activities_prospect_idx ON public.activities (prospect_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activities_deal_idx ON public.activities (deal_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activities_org_idx ON public.activities (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activities_contact_idx ON public.activities (contact_id, occurred_at DESC);

-- TASKS ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  details text,
  task_type text NOT NULL DEFAULT 'follow_up',
  owner_side text NOT NULL DEFAULT 'seller',
  owner_id uuid,
  owner_name text,
  due_date date,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales and agents view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role));

CREATE POLICY "Sales and agents insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role)) AND created_by = auth.uid());

CREATE POLICY "Owners update their tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (owner_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Owners delete their tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid());

CREATE INDEX IF NOT EXISTS tasks_due_idx ON public.tasks (status, due_date);
CREATE INDEX IF NOT EXISTS tasks_prospect_idx ON public.tasks (prospect_id);
CREATE INDEX IF NOT EXISTS tasks_deal_idx ON public.tasks (deal_id);

-- DEAL PEOPLE ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_role text NOT NULL DEFAULT 'influencer',
  stance text,
  influence text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, contact_id, deal_role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_people TO authenticated;
GRANT ALL ON public.deal_people TO service_role;
ALTER TABLE public.deal_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales team manage deal people" ON public.deal_people
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role));

-- updated_at triggers -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS activities_updated_at ON public.activities;
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS deal_people_updated_at ON public.deal_people;
CREATE TRIGGER deal_people_updated_at BEFORE UPDATE ON public.deal_people
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- audit triggers ------------------------------------------------------------
DROP TRIGGER IF EXISTS audit_activities ON public.activities;
CREATE TRIGGER audit_activities AFTER INSERT OR UPDATE OR DELETE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
DROP TRIGGER IF EXISTS audit_tasks ON public.tasks;
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
DROP TRIGGER IF EXISTS audit_deal_people ON public.deal_people;
CREATE TRIGGER audit_deal_people AFTER INSERT OR UPDATE OR DELETE ON public.deal_people
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- prospect stage automation + last activity ---------------------------------
CREATE OR REPLACE FUNCTION public.activity_touch_prospect()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.prospect_id IS NOT NULL THEN
    UPDATE public.prospects
    SET last_activity_at = GREATEST(COALESCE(last_activity_at, NEW.occurred_at), NEW.occurred_at),
        stage = CASE
          WHEN NEW.activity_type IN ('card_drop_off','in_person_visit','call','email','linkedin','text','voicemail','walk_in')
               AND stage IN ('target','prospect')
            THEN 'contacted'::public.prospect_stage
          ELSE stage
        END,
        stage_changed_at = CASE
          WHEN NEW.activity_type IN ('card_drop_off','in_person_visit','call','email','linkedin','text','voicemail','walk_in')
               AND stage IN ('target','prospect')
            THEN now() ELSE stage_changed_at
        END
    WHERE id = NEW.prospect_id;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.activity_touch_prospect() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS activities_touch_prospect ON public.activities;
CREATE TRIGGER activities_touch_prospect AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.activity_touch_prospect();

-- migrate existing card drop-off visits into activities ----------------------
INSERT INTO public.activities (
  activity_type, subject, body, occurred_at, prospect_id, person_spoken_to,
  outcome, follow_up_on, follow_up_done, owner_id, created_by, created_at
)
SELECT
  'card_drop_off',
  'Card drop-off',
  v.outcome_notes,
  v.visited_at,
  v.prospect_id,
  v.person_spoken_to,
  CASE v.contact_made::text
    WHEN 'yes' THEN 'Spoke with someone'
    WHEN 'card_only' THEN 'Left card only'
    ELSE 'No contact'
  END,
  v.follow_up_due,
  v.follow_up_done,
  v.rep_id,
  v.created_by,
  v.created_at
FROM public.prospect_visits v
WHERE NOT EXISTS (
  SELECT 1 FROM public.activities a
  WHERE a.prospect_id = v.prospect_id AND a.occurred_at = v.visited_at AND a.activity_type = 'card_drop_off'
);