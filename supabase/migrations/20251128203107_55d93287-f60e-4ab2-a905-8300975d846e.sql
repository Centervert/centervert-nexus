-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Create simpler, non-recursive policy for viewing profiles
-- Users can view: their own profile, admin/agent can view all, users can view others in same org
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
  OR (
    organization_id IS NOT NULL 
    AND organization_id IN (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid() AND p.organization_id IS NOT NULL
    )
  )
);