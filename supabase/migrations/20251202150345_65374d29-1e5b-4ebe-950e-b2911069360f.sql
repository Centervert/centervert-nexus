-- Drop existing opportunity-attachments storage policies
DROP POLICY IF EXISTS "Admins and agents can upload opportunity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins and agents can view opportunity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins and agents can delete opportunity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload opportunity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view opportunity attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete opportunity attachments" ON storage.objects;

-- Create new policies that include all CRM roles (admin, agent, sales_agent)
CREATE POLICY "CRM users can upload opportunity attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'opportunity-attachments' 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'agent') 
    OR has_role(auth.uid(), 'sales_agent')
  )
);

CREATE POLICY "CRM users can view opportunity attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'opportunity-attachments' 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'agent') 
    OR has_role(auth.uid(), 'sales_agent')
  )
);

CREATE POLICY "CRM users can delete opportunity attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'opportunity-attachments' 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'agent') 
    OR has_role(auth.uid(), 'sales_agent')
  )
);