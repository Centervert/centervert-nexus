-- Add is_final_deliverable column to opportunity_attachments table
ALTER TABLE public.opportunity_attachments
ADD COLUMN is_final_deliverable BOOLEAN NOT NULL DEFAULT false;