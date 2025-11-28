-- Fix infinite recursion by creating security definer function
-- This function retrieves user's organization_id without triggering RLS

CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM profiles
  WHERE id = _user_id
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

-- Create new non-recursive policy using the security definer function
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
  OR (
    organization_id IS NOT NULL 
    AND organization_id = get_user_organization_id(auth.uid())
  )
);