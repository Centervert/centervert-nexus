-- Add position column for resource ordering
ALTER TABLE public.opportunity_attachments 
ADD COLUMN position integer DEFAULT 0;

-- Update existing records with sequential positions
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY opportunity_id ORDER BY created_at) - 1 as row_num
  FROM opportunity_attachments
)
UPDATE opportunity_attachments 
SET position = numbered.row_num
FROM numbered
WHERE opportunity_attachments.id = numbered.id;