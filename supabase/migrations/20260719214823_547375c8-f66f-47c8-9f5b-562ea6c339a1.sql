
-- Deal stage enum
DO $$ BEGIN
  CREATE TYPE public.deal_stage AS ENUM ('new','qualifying','proposal','negotiation','won','lost','on_hold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS stage public.deal_stage NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS lost_reason text;

-- Backfill from status
UPDATE public.deals
SET stage = CASE
  WHEN status = 'won' THEN 'won'::public.deal_stage
  WHEN status = 'lost' THEN 'lost'::public.deal_stage
  ELSE 'qualifying'::public.deal_stage
END;

-- Keep legacy status column synced from stage
CREATE OR REPLACE FUNCTION public.sync_deal_status_from_stage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.status := CASE NEW.stage
    WHEN 'won' THEN 'won'
    WHEN 'lost' THEN 'lost'
    ELSE 'active'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_deal_status ON public.deals;
CREATE TRIGGER trg_sync_deal_status
BEFORE INSERT OR UPDATE OF stage ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.sync_deal_status_from_stage();

CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
