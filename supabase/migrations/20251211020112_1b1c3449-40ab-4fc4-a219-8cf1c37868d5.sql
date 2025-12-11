-- Add value_type column to opportunities for tracking if value is one-time, recurring, or linked to income
ALTER TABLE public.opportunities 
ADD COLUMN value_type text DEFAULT 'one-time';