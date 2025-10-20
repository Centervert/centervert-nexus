
-- Update ticket_messages policies to allow agency users

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create messages on accessible tickets" ON ticket_messages;

-- Create new INSERT policy with agency support
CREATE POLICY "Users can create messages on accessible tickets"
ON ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_messages.ticket_id
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

-- Update SELECT policy for consistency
DROP POLICY IF EXISTS "Users can view messages on accessible tickets" ON ticket_messages;

CREATE POLICY "Users can view messages on accessible tickets"
ON ticket_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE t.id = ticket_messages.ticket_id
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
