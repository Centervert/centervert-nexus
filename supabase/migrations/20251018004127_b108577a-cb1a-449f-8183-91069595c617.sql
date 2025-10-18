-- Add DELETE policy for ticket_quotes
-- Allow admins and agents to delete quotes
CREATE POLICY "Admins and agents can delete quotes"
ON ticket_quotes
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role)
);