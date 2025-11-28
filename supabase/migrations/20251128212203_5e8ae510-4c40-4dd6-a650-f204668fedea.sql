-- Safely add sales_agent to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'sales_agent' 
    AND enumtypid = 'app_role'::regtype
  ) THEN
    ALTER TYPE app_role ADD VALUE 'sales_agent';
  END IF;
END $$;