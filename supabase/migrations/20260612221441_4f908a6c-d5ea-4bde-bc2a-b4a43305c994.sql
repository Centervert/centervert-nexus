
-- 1) Replace permissive deal-attachments storage SELECT policy with a deal-scoped one
DROP POLICY IF EXISTS "Anyone can view deal attachments" ON storage.objects;

CREATE POLICY "Users can view deal attachments they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deal-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.deal_attachments da
    JOIN public.deals d ON d.id = da.deal_id
    WHERE da.storage_path = storage.objects.name
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_role(auth.uid(), 'agent'::public.app_role)
        OR public.has_role(auth.uid(), 'sales_agent'::public.app_role)
        OR d.owner_id = auth.uid()
        OR d.created_by = auth.uid()
      )
  )
);

-- 2) Tighten notifications INSERT policy (was WITH CHECK true)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create their own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());
-- service_role bypasses RLS, so edge functions and SECURITY DEFINER triggers continue to insert notifications for any user.

-- 3) Tighten organization-attachments storage policies to require a tracked file_path
DROP POLICY IF EXISTS "Admins agents sales agents can view organization attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins agents sales agents can delete organization attachments" ON storage.objects;

CREATE POLICY "CRM users can view organization attachments by tracked path"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-attachments'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'agent'::public.app_role)
    OR public.has_role(auth.uid(), 'sales_agent'::public.app_role)
  )
  AND EXISTS (
    SELECT 1 FROM public.organization_attachments oa
    WHERE oa.file_path = storage.objects.name
  )
);

CREATE POLICY "CRM users can delete organization attachments by tracked path"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-attachments'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'agent'::public.app_role)
    OR public.has_role(auth.uid(), 'sales_agent'::public.app_role)
  )
  AND EXISTS (
    SELECT 1 FROM public.organization_attachments oa
    WHERE oa.file_path = storage.objects.name
  )
);
