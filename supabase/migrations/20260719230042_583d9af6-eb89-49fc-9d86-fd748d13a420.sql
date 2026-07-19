
-- 1. Fix deal-attachments INSERT: require CRM roles
DROP POLICY IF EXISTS "Authenticated users can upload deal attachments" ON storage.objects;
CREATE POLICY "CRM users can upload deal attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'deal-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
    OR has_role(auth.uid(), 'sales_agent'::app_role)
  )
);

-- 2. Add project-resources SELECT policy for project team members / owners
CREATE POLICY "Project members can view project resource files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-resources'
  AND EXISTS (
    SELECT 1
    FROM public.project_resources pr
    JOIN public.projects p ON p.id = pr.project_id
    WHERE pr.file_path = storage.objects.name
      AND (
        p.owner_id = auth.uid()
        OR p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_team_members ptm
          WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
        )
      )
  )
);

-- 3. Tighten ticket-attachments SELECT: match folder path user segment to auth.uid()
DROP POLICY IF EXISTS "Users can view files from accessible tickets" ON storage.objects;
CREATE POLICY "Users can view their own ticket attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
    OR has_role(auth.uid(), 'sales_agent'::app_role)
  )
);

-- 4. Revoke EXECUTE from authenticated on SECURITY DEFINER internal helpers.
--    Keep get_users_with_roles callable — it's used via RPC from the admin UI.
REVOKE EXECUTE ON FUNCTION public.cleanup_orphaned_profiles() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_billcom_sync_log(uuid, billcom_activity_type, text, jsonb, uuid) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.extract_mentioned_users(text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_available_agents() FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, authenticated;
