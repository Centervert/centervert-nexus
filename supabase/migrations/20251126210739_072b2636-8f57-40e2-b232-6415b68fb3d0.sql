-- Drop and recreate get_users_with_roles function to include is_active status
DROP FUNCTION IF EXISTS public.get_users_with_roles();

CREATE FUNCTION public.get_users_with_roles()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  is_active boolean,
  roles text[],
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.is_active,
    ARRAY_AGG(ur.role::TEXT) as roles,
    p.created_at
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.avatar_url, p.is_active, p.created_at
  ORDER BY p.created_at DESC
$$;