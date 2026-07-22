-- Revoke public/authenticated execute on functions that don't need direct client access
REVOKE EXECUTE ON FUNCTION public.extract_mentioned_users(text) FROM PUBLIC, anon, authenticated;

-- Convert get_available_agents to SECURITY INVOKER; user_roles + profiles are readable by authenticated
CREATE OR REPLACE FUNCTION public.get_available_agents()
 RETURNS TABLE(id uuid, email text, full_name text)
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT
    p.id,
    p.email,
    p.full_name
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role IN ('admin', 'agent', 'sales_agent')
  ORDER BY p.full_name
$function$;

REVOKE EXECUTE ON FUNCTION public.get_available_agents() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_agents() TO authenticated, service_role;
