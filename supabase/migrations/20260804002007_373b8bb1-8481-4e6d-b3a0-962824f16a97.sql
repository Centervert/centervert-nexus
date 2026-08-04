DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prospect_stage') THEN
    CREATE TYPE public.prospect_stage AS ENUM (
      'target','prospect','contacted','connected','discovery_scheduled','converted'
    );
  END IF;
END$$;

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS stage public.prospect_stage NOT NULL DEFAULT 'target',
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS interest_level text,
  ADD COLUMN IF NOT EXISTS has_possible_problem boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spoke_with_relevant_person boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discovery_scheduled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS next_action_due_on date,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz NOT NULL DEFAULT now();

UPDATE public.prospects
SET stage = CASE status
  WHEN 'converted' THEN 'converted'::public.prospect_stage
  WHEN 'warm' THEN 'connected'::public.prospect_stage
  WHEN 'new' THEN 'target'::public.prospect_stage
  ELSE 'prospect'::public.prospect_stage
END
WHERE stage = 'target';

UPDATE public.prospects p
SET last_activity_at = v.last_visit
FROM (
  SELECT prospect_id, MAX(visited_at) AS last_visit
  FROM public.prospect_visits GROUP BY prospect_id
) v
WHERE v.prospect_id = p.id AND p.last_activity_at IS NULL;

CREATE INDEX IF NOT EXISTS prospects_stage_idx ON public.prospects (stage);
CREATE INDEX IF NOT EXISTS prospects_organization_idx ON public.prospects (organization_id);