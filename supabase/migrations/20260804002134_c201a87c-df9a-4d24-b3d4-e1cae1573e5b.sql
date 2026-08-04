ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS pricing_model text,
  ADD COLUMN IF NOT EXISTS quoted_amount numeric,
  ADD COLUMN IF NOT EXISTS scope_summary text,
  ADD COLUMN IF NOT EXISTS payment_schedule text,
  ADD COLUMN IF NOT EXISTS contract_status text,
  ADD COLUMN IF NOT EXISTS legal_review_status text,
  ADD COLUMN IF NOT EXISTS security_review_status text,
  ADD COLUMN IF NOT EXISTS po_status text,
  ADD COLUMN IF NOT EXISTS signer_name text,
  ADD COLUMN IF NOT EXISTS signer_title text,
  ADD COLUMN IF NOT EXISTS loss_category text,
  ADD COLUMN IF NOT EXISTS loss_detail text,
  ADD COLUMN IF NOT EXISTS had_champion boolean,
  ADD COLUMN IF NOT EXISTS economic_buyer_confirmed boolean,
  ADD COLUMN IF NOT EXISTS reengage_on date;

CREATE OR REPLACE VIEW public.prospect_stage_counts
WITH (security_invoker = true) AS
SELECT stage::text AS stage,
       count(*)::bigint AS prospect_count,
       count(*) FILTER (WHERE last_activity_at IS NULL OR last_activity_at < now() - interval '14 days')::bigint AS stale_count,
       avg(EXTRACT(EPOCH FROM (now() - stage_changed_at)) / 86400)::numeric AS avg_days_in_stage
FROM public.prospects
GROUP BY stage;

CREATE OR REPLACE VIEW public.prospect_conversion
WITH (security_invoker = true) AS
SELECT owner_id,
       count(*)::bigint AS total_prospects,
       count(*) FILTER (WHERE converted_deal_id IS NOT NULL)::bigint AS converted_prospects,
       count(*) FILTER (WHERE stage = 'discovery_scheduled')::bigint AS discovery_scheduled
FROM public.prospects
GROUP BY owner_id;

CREATE OR REPLACE VIEW public.opportunity_pipeline
WITH (security_invoker = true) AS
SELECT stage::text AS stage,
       count(*)::bigint AS deal_count,
       COALESCE(sum(expected_value), 0)::numeric AS pipeline_value,
       avg(qualification_score)::numeric AS avg_score,
       sum(critical_gap_count)::bigint AS total_gaps
FROM public.deals
GROUP BY stage;

CREATE OR REPLACE VIEW public.activity_volume
WITH (security_invoker = true) AS
SELECT date_trunc('week', occurred_at)::date AS week,
       activity_type,
       owner_id,
       count(*)::bigint AS activity_count
FROM public.activities
GROUP BY 1, 2, 3;

GRANT SELECT ON public.prospect_stage_counts TO authenticated;
GRANT SELECT ON public.prospect_conversion TO authenticated;
GRANT SELECT ON public.opportunity_pipeline TO authenticated;
GRANT SELECT ON public.activity_volume TO authenticated;