-- has_role must be executable by authenticated users because RLS policies
-- (including the policy on public.user_roles itself) call it.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
