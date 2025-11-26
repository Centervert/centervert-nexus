-- Add created_by column to contacts table
ALTER TABLE contacts ADD COLUMN created_by uuid REFERENCES profiles(id);

-- Set existing contacts to be owned by the first admin (if any exist)
UPDATE contacts 
SET created_by = (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE created_by IS NULL;