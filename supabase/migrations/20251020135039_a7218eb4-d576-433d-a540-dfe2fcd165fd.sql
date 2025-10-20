
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view quotes on accessible tickets" ON ticket_quotes;

-- Create updated policy that handles agency users
CREATE POLICY "Users can view quotes on accessible tickets"
ON ticket_quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_quotes.ticket_id
    AND (
      t.created_by = auth.uid() 
      OR t.assigned_to = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role)
      OR (
        -- Direct client access
        t.client_id IS NOT NULL 
        AND t.client_id IN (
          SELECT client_id 
          FROM profiles 
          WHERE id = auth.uid()
        )
      )
      OR (
        -- Agency access
        t.client_id IN (
          SELECT c.id 
          FROM clients c
          INNER JOIN profiles p ON p.client_id = c.managing_agency_id
          WHERE p.id = auth.uid()
        )
      )
    )
  )
);

-- Also update the UPDATE policy for quotes
DROP POLICY IF EXISTS "Users can update quotes on their tickets" ON ticket_quotes;

CREATE POLICY "Users can update quotes on their tickets"
ON ticket_quotes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_quotes.ticket_id
    AND (
      t.created_by = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role)
      OR (
        -- Direct client access
        t.client_id IS NOT NULL 
        AND t.client_id IN (
          SELECT client_id 
          FROM profiles 
          WHERE id = auth.uid()
        )
      )
      OR (
        -- Agency access
        t.client_id IN (
          SELECT c.id 
          FROM clients c
          INNER JOIN profiles p ON p.client_id = c.managing_agency_id
          WHERE p.id = auth.uid()
        )
      )
    )
  )
);
