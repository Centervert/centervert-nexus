-- Update RLS policies to include sales_agent role for CRM access

-- Contacts table policies
DROP POLICY IF EXISTS "Admins and agents can manage contacts" ON contacts;
CREATE POLICY "Admins, agents, and sales agents can manage contacts" 
ON contacts 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

-- Organizations table policies
DROP POLICY IF EXISTS "Admins and agents can manage companies" ON organizations;
CREATE POLICY "Admins, agents, and sales agents can manage organizations" 
ON organizations 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

-- Opportunities table policies
DROP POLICY IF EXISTS "Admins and agents can manage opportunities" ON opportunities;
CREATE POLICY "Admins, agents, and sales agents can manage opportunities" 
ON opportunities 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

DROP POLICY IF EXISTS "Users can view opportunities they own" ON opportunities;
CREATE POLICY "Users can view opportunities they own" 
ON opportunities 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
  OR owner_id = auth.uid() 
  OR created_by = auth.uid()
);

-- Opportunity updates policies
DROP POLICY IF EXISTS "Admins and agents can manage updates" ON opportunity_updates;
CREATE POLICY "Admins, agents, and sales agents can manage updates" 
ON opportunity_updates 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

DROP POLICY IF EXISTS "Users can view updates for their opportunities" ON opportunity_updates;
CREATE POLICY "Users can view updates for their opportunities" 
ON opportunity_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM opportunities o 
    WHERE o.id = opportunity_updates.opportunity_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role)
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR o.owner_id = auth.uid() 
      OR o.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Opportunity participants can create updates" ON opportunity_updates;
CREATE POLICY "Opportunity participants can create updates" 
ON opportunity_updates 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM opportunities o 
    WHERE o.id = opportunity_updates.opportunity_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role)
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR o.owner_id = auth.uid() 
      OR o.created_by = auth.uid()
    )
  )
);

-- Opportunity team members policies
DROP POLICY IF EXISTS "Admins and agents can manage team members" ON opportunity_team_members;
CREATE POLICY "Admins, agents, and sales agents can manage team members" 
ON opportunity_team_members 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

DROP POLICY IF EXISTS "Users can view team members for their opportunities" ON opportunity_team_members;
CREATE POLICY "Users can view team members for their opportunities" 
ON opportunity_team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM opportunities o 
    WHERE o.id = opportunity_team_members.opportunity_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role)
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR o.owner_id = auth.uid() 
      OR o.created_by = auth.uid() 
      OR opportunity_team_members.user_id = auth.uid()
    )
  )
);

-- Opportunity attachments policies
DROP POLICY IF EXISTS "Admins and agents can manage attachments" ON opportunity_attachments;
CREATE POLICY "Admins, agents, and sales agents can manage attachments" 
ON opportunity_attachments 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

DROP POLICY IF EXISTS "Users can view attachments for opportunities they can see" ON opportunity_attachments;
CREATE POLICY "Users can view attachments for opportunities they can see" 
ON opportunity_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM opportunities o 
    WHERE o.id = opportunity_attachments.opportunity_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role)
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR o.owner_id = auth.uid() 
      OR o.created_by = auth.uid()
    )
  )
);

-- Update Bill.com sync logs policy to include sales agents viewing
DROP POLICY IF EXISTS "Admins and team members can view all logs" ON billcom_sync_logs;
CREATE POLICY "Admins, agents, and sales agents can view all logs" 
ON billcom_sync_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

-- Update profiles view policy to include sales agents
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR has_role(auth.uid(), 'sales_agent'::app_role)
  OR (organization_id IS NOT NULL AND organization_id = get_user_organization_id(auth.uid()))
);