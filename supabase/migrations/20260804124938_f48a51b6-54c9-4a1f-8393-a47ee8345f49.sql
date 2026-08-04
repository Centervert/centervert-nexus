CREATE OR REPLACE FUNCTION public.recompute_deal_qualification_score(_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile text;
  v_keys text[];
  v_score int;
BEGIN
  SELECT methodology_profile INTO v_profile FROM public.deals WHERE id = _deal_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_keys := CASE COALESCE(v_profile, 'full')
    WHEN 'standard' THEN ARRAY['metrics','economic_buyer','decision_criteria','decision_process','pain','champion']
    WHEN 'lite' THEN ARRAY['pain','metrics','economic_buyer','decision_process']
    ELSE ARRAY['metrics','economic_buyer','decision_criteria','decision_process','paper_process','pain','champion','competition']
  END;

  SELECT COALESCE(SUM(score), 0) INTO v_score
  FROM public.deal_elements
  WHERE deal_id = _deal_id AND element = ANY(v_keys);

  UPDATE public.deals SET qualification_score = v_score WHERE id = _deal_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recompute_deal_qualification_score(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recompute_deal_qualification_score(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.deal_elements_sync_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_deal_qualification_score(COALESCE(NEW.deal_id, OLD.deal_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS deal_elements_sync_score ON public.deal_elements;
CREATE TRIGGER deal_elements_sync_score
AFTER INSERT OR UPDATE OR DELETE ON public.deal_elements
FOR EACH ROW EXECUTE FUNCTION public.deal_elements_sync_score();

CREATE OR REPLACE FUNCTION public.deals_profile_sync_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.methodology_profile IS DISTINCT FROM OLD.methodology_profile THEN
    PERFORM public.recompute_deal_qualification_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deals_profile_sync_score ON public.deals;
CREATE TRIGGER deals_profile_sync_score
AFTER UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.deals_profile_sync_score();

-- Backfill existing deals
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.deals LOOP
    PERFORM public.recompute_deal_qualification_score(r.id);
  END LOOP;
END $$;