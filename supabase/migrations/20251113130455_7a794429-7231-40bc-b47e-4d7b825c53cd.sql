-- Add new columns to contacts table for CRM functionality
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone_numbers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_source text,
  ADD COLUMN IF NOT EXISTS last_contact_date timestamptz,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS preferred_contact_method text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- Data migration: Split existing full_name into first_name and last_name
UPDATE contacts
SET 
  first_name = COALESCE(split_part(full_name, ' ', 1), ''),
  last_name = CASE 
    WHEN array_length(string_to_array(full_name, ' '), 1) > 1 
    THEN substring(full_name from length(split_part(full_name, ' ', 1)) + 2)
    ELSE ''
  END
WHERE first_name IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_first_name ON contacts(first_name);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);

-- Update RLS policies for contacts
DROP POLICY IF EXISTS "Admins can manage all contacts" ON contacts;

CREATE POLICY "Admins can manage all contacts"
ON contacts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for agents to view contacts
CREATE POLICY "Agents can view all contacts"
ON contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role)
);