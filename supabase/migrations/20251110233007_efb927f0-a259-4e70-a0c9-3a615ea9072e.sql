-- Add document_type column to opportunity_attachments table and remove is_final_deliverable
ALTER TABLE public.opportunity_attachments
DROP COLUMN IF EXISTS is_final_deliverable;

ALTER TABLE public.opportunity_attachments
ADD COLUMN document_type TEXT NOT NULL DEFAULT 'supporting_documents';