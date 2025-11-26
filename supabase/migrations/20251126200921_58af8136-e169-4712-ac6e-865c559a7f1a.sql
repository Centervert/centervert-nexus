-- Add show_in_all_contacts column to contacts table
ALTER TABLE contacts 
ADD COLUMN show_in_all_contacts BOOLEAN NOT NULL DEFAULT true;

-- Update RLS policy for viewing contacts
-- Drop existing policy
DROP POLICY IF EXISTS "Admins and agents can manage contacts" ON contacts;
DROP POLICY IF EXISTS "Client users can view their company contacts" ON contacts;

-- Recreate with updated logic
CREATE POLICY "Admins and agents can manage contacts"
ON contacts
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Users can view contacts based on visibility"
ON contacts
FOR SELECT
USING (
  -- Admins and agents can see everything
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role))
  OR
  -- Regular users can see contacts shown to all
  (has_role(auth.uid(), 'user'::app_role) AND show_in_all_contacts = true AND EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = contacts.company_id
  ))
  OR
  -- Creator can always see their own contacts
  (created_by = auth.uid())
);