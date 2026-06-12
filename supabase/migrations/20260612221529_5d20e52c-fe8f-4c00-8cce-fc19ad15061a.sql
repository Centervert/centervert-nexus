
REVOKE EXECUTE ON FUNCTION public.extract_mentioned_users(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_billcom_sync_log(uuid, public.billcom_activity_type, text, jsonb, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_orphaned_profiles() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_users_with_roles() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_available_agents() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.extract_mentioned_users(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_billcom_sync_log(uuid, public.billcom_activity_type, text, jsonb, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_profiles() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_available_agents() TO authenticated, service_role;

-- handle_new_user, handle_updated_at, create_*_mention_notifications are trigger functions
-- and are not invoked directly via the API; revoke public execute as defense in depth.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_project_mention_notifications() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_mention_notifications() FROM anon, authenticated, PUBLIC;
