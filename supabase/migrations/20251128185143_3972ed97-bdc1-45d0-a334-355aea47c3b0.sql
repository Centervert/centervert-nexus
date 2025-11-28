-- CRITICAL SECURITY FIXES: Restrict public access to sensitive data

-- 1. FIX: Restrict profile access to authenticated users only
-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create secure policy: Users can only view profiles within their organization or their own
CREATE POLICY "Users can view profiles in their organization"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id  -- Can view own profile
  OR
  has_role(auth.uid(), 'admin')  -- Admins can view all
  OR
  has_role(auth.uid(), 'agent')  -- Agents can view all
  OR
  (
    organization_id IS NOT NULL 
    AND organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )  -- Can view profiles in same organization
);

-- 2. FIX: Restrict system_settings to admins and agents only
-- Remove the public access policy
DROP POLICY IF EXISTS "Anyone can view settings" ON system_settings;

-- Create secure policy: Only authenticated team members can view settings
CREATE POLICY "Admins and agents can view settings"
ON system_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- 3. FIX: Restrict user_roles to authenticated users only
-- Remove the public access policy
DROP POLICY IF EXISTS "Users can view all roles" ON user_roles;

-- Create secure policy: Users can view their own roles, admins/agents can view all
CREATE POLICY "Users can view roles securely"
ON user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()  -- Can view own roles
  OR
  has_role(auth.uid(), 'admin')  -- Admins can view all roles
  OR
  has_role(auth.uid(), 'agent')  -- Agents can view all roles
);

-- 4. FIX: Require authentication for invitation access
-- Remove the public access policy
DROP POLICY IF EXISTS "Users can view invitations by token" ON invitations;

-- Create secure policy: Only allow viewing invitations with valid token AND require some form of authentication context
-- Note: For invitation acceptance flow, we'll need to handle this in the edge function
CREATE POLICY "Authenticated access to invitations"
ON invitations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')  -- Admins can view all
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())  -- Users can view invitations sent to their email
);

-- Create a service role policy for the invitation edge functions
CREATE POLICY "Service role can manage invitations"
ON invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Add indexes for performance on the new policies
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- 6. Add comments documenting the security model
COMMENT ON POLICY "Users can view profiles in their organization" ON profiles IS 
'Security: Users can only view their own profile, profiles in their organization, or all profiles if admin/agent';

COMMENT ON POLICY "Admins and agents can view settings" ON system_settings IS 
'Security: System settings contain sensitive configuration and are restricted to team members only';

COMMENT ON POLICY "Users can view roles securely" ON user_roles IS 
'Security: Users can view their own roles. Admins and agents can view all roles for user management';

COMMENT ON POLICY "Authenticated access to invitations" ON invitations IS 
'Security: Invitations are restricted to authenticated users. Service role handles invitation acceptance flow';