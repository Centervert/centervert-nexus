-- Add phase_target column to projects table if it doesn't exist
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS phase_target TEXT;