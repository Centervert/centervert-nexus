-- Fix infinite recursion in opportunity_team_members and opportunity_updates RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins and agents can manage team members" ON opportunity_team_members;
DROP POLICY IF EXISTS "Users can view team members for opportunities they can access" ON opportunity_team_members;
DROP POLICY IF EXISTS "Admins and agents can manage updates" ON opportunity_updates;
DROP POLICY IF EXISTS "Users can view updates for opportunities they can access" ON opportunity_updates;
DROP POLICY IF EXISTS "Team members can create updates" ON opportunity_updates;

-- Create new non-recursive policies for opportunity_team_members
CREATE POLICY "Admins and agents can manage team members"
ON opportunity_team_members
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Users can view team members for their opportunities"
ON opportunity_team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id = opportunity_team_members.opportunity_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'agent'::app_role) OR
      o.owner_id = auth.uid() OR
      o.created_by = auth.uid() OR
      opportunity_team_members.user_id = auth.uid()
    )
  )
);

-- Create new non-recursive policies for opportunity_updates
CREATE POLICY "Admins and agents can manage updates"
ON opportunity_updates
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Users can view updates for their opportunities"
ON opportunity_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id = opportunity_updates.opportunity_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'agent'::app_role) OR
      o.owner_id = auth.uid() OR
      o.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Opportunity participants can create updates"
ON opportunity_updates
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id = opportunity_updates.opportunity_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'agent'::app_role) OR
      o.owner_id = auth.uid() OR
      o.created_by = auth.uid()
    )
  )
);