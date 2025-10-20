
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;

-- Create updated policy that handles agency users seeing their managed clients' tickets
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
    -- Direct client access: user belongs to the same client
    client_id IS NOT NULL 
    AND client_id IN (
      SELECT client_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  OR (
    -- Agency access: user belongs to an agency that manages this ticket's client
    client_id IN (
      SELECT c.id 
      FROM clients c
      INNER JOIN profiles p ON p.client_id = c.managing_agency_id
      WHERE p.id = auth.uid()
    )
  )
);
