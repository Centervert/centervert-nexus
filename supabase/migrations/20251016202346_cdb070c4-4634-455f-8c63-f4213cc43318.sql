-- Add deleted_at column to clients table for soft deletes
ALTER TABLE clients ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add is_active column to profiles table to deactivate users
ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create index for deleted clients
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NOT NULL;

-- Update RLS policies to exclude deleted clients by default
DROP POLICY IF EXISTS "Users can view their own client" ON clients;
DROP POLICY IF EXISTS "Agency users can view and manage their clients" ON clients;

CREATE POLICY "Users can view their own active client" 
ON clients 
FOR SELECT 
USING (
  (id IN (SELECT profiles.client_id FROM profiles WHERE profiles.id = auth.uid()) 
  AND deleted_at IS NULL)
);

CREATE POLICY "Agency users can view and manage their active clients" 
ON clients 
FOR SELECT 
USING (
  (has_role(auth.uid(), 'agent'::app_role) OR 
   managing_agency_id IN (SELECT profiles.client_id FROM profiles WHERE profiles.id = auth.uid()))
  AND deleted_at IS NULL
);

-- Admins can view all clients including deleted ones
CREATE POLICY "Admins can view all clients including deleted" 
ON clients 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to soft delete client and deactivate users
CREATE OR REPLACE FUNCTION soft_delete_client(client_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Soft delete the client
  UPDATE clients 
  SET deleted_at = NOW()
  WHERE id = client_id_param;
  
  -- Deactivate all users associated with this client
  UPDATE profiles 
  SET is_active = false
  WHERE client_id = client_id_param;
END;
$$;

-- Create function to restore client and reactivate users
CREATE OR REPLACE FUNCTION restore_client(client_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Restore the client
  UPDATE clients 
  SET deleted_at = NULL
  WHERE id = client_id_param;
  
  -- Reactivate all users associated with this client
  UPDATE profiles 
  SET is_active = true
  WHERE client_id = client_id_param;
END;
$$;