-- Update existing profiles that have a client_id but no company name
UPDATE profiles p
SET company = c.name
FROM clients c
WHERE p.client_id = c.id
  AND (p.company IS NULL OR p.company = '');

-- Create a function to automatically update company name when client_id changes
CREATE OR REPLACE FUNCTION sync_profile_company()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL AND (NEW.company IS NULL OR NEW.company = '') THEN
    SELECT name INTO NEW.company
    FROM clients
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-populate company name
DROP TRIGGER IF EXISTS sync_profile_company_trigger ON profiles;
CREATE TRIGGER sync_profile_company_trigger
BEFORE INSERT OR UPDATE OF client_id ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_company();