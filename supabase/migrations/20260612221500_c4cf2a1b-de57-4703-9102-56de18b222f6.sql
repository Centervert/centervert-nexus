
DROP POLICY IF EXISTS "System can create logs" ON public.billcom_sync_logs;

CREATE POLICY "Authenticated users can create their own logs"
ON public.billcom_sync_logs FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());
-- service_role bypasses RLS, so the scheduled sync edge function continues to write logs.
