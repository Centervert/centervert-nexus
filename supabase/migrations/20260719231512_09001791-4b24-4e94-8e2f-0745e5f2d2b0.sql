GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extract_mentioned_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_agents() TO authenticated;