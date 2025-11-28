-- Update get_available_agents function to include sales agents for opportunity assignment
DROP FUNCTION IF EXISTS get_available_agents();

CREATE OR REPLACE FUNCTION get_available_agents()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    p.id,
    p.email,
    p.full_name
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role IN ('admin', 'agent', 'sales_agent')
  ORDER BY p.full_name
$$;