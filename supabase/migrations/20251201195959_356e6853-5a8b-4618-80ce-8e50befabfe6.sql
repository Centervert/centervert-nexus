-- Add deleted_at column for soft deletes
ALTER TABLE public.income ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Remove is_active column since we're using status (verified/projected) and soft delete instead
ALTER TABLE public.income DROP COLUMN is_active;