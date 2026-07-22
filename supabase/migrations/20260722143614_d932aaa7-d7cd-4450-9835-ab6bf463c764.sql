
-- ─── audit_log table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  actor_source text NOT NULL DEFAULT 'user', -- 'user' | 'agent' | 'system'
  old_data jsonb,
  new_data jsonb,
  changed_fields jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies → app users cannot mutate. Triggers run as
-- SECURITY DEFINER so writes still succeed regardless of RLS.

-- ─── generic audit trigger function ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_source text := CASE WHEN auth.uid() IS NULL THEN 'agent' ELSE 'user' END;
  v_old jsonb;
  v_new jsonb;
  v_changed jsonb := '{}'::jsonb;
  v_record_id uuid;
  k text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_record_id := (v_new->>'id')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_record_id := (v_new->>'id')::uuid;
    -- Compute per-field diff, skipping noisy timestamps
    FOR k IN SELECT jsonb_object_keys(v_new) LOOP
      IF k NOT IN ('updated_at') AND (v_old->k) IS DISTINCT FROM (v_new->k) THEN
        v_changed := v_changed || jsonb_build_object(
          k, jsonb_build_object('old', v_old->k, 'new', v_new->k)
        );
      END IF;
    END LOOP;
    -- If nothing meaningful changed, skip logging
    IF v_changed = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_record_id := (v_old->>'id')::uuid;
  END IF;

  INSERT INTO public.audit_log (
    table_name, record_id, action, actor_id, actor_source,
    old_data, new_data, changed_fields
  ) VALUES (
    TG_TABLE_NAME, v_record_id, TG_OP, v_actor, v_source,
    v_old, v_new, NULLIF(v_changed, '{}'::jsonb)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── attach trigger to core tables ────────────────────────────────────────────
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'contacts','organizations','deals','deal_messages',
    'projects','project_tasks','project_updates','project_decisions','project_risks',
    'employees','employee_raises','employee_notes',
    'expenses','income','invoices',
    'prospects','prospect_visits',
    'user_roles','profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
      EXECUTE format(
        'CREATE TRIGGER audit_%1$s
           AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
           FOR EACH ROW EXECUTE FUNCTION public.log_audit_event()',
        t
      );
    END IF;
  END LOOP;
END $$;
