
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;

-- Create updated policy that includes client_id check
CREATE POLICY "Users can view their own tickets"
ON tickets
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
  OR (
    client_id IS NOT NULL 
    AND client_id IN (
      SELECT client_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
);
