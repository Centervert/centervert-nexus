-- Create storage policies for ticket-attachments bucket to match database RLS policies
-- This ensures files are only accessible to users who have access to the associated ticket

-- Policy: Users can view attachments on tickets they have access to
CREATE POLICY "Users can view attachments on accessible tickets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1
    FROM attachments
    JOIN tickets ON tickets.id = attachments.ticket_id
    WHERE attachments.file_url LIKE '%' || storage.objects.name
    AND (
      tickets.created_by = auth.uid()
      OR tickets.assigned_to = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'agent'::app_role)
    )
  )
);

-- Policy: Users can upload attachments to tickets they have access to
CREATE POLICY "Users can upload attachments to accessible tickets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'agent'::app_role)
    OR auth.uid() IN (
      SELECT created_by FROM tickets
      WHERE tickets.id IN (
        SELECT ticket_id FROM attachments 
        WHERE file_url LIKE '%' || storage.objects.name
      )
    )
  )
);

-- Policy: Users can delete their own attachments or admins can delete any
CREATE POLICY "Users can delete own attachments or admins can delete any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM attachments
      WHERE attachments.file_url LIKE '%' || storage.objects.name
      AND attachments.uploaded_by = auth.uid()
    )
  )
);