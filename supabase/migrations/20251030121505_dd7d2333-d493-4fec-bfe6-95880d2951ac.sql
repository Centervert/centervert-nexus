-- Create a function to clean up orphaned profile data
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profiles()
RETURNS TABLE(deleted_profile_id uuid, deleted_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = p.id
  )
  RETURNING p.id, p.email;
  
  -- Also clean up orphaned user_roles
  DELETE FROM user_roles ur
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = ur.user_id
  );
END;
$$;

COMMENT ON FUNCTION public.cleanup_orphaned_profiles() IS 'Removes profile and user_role records that no longer have corresponding auth.users entries';