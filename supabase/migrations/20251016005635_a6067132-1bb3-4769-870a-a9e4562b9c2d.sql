-- Add company field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company text;