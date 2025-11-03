-- Add phone extension field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS phone_extension TEXT;

-- Add phone extension field to client_contacts table
ALTER TABLE public.client_contacts 
ADD COLUMN IF NOT EXISTS phone_extension TEXT;