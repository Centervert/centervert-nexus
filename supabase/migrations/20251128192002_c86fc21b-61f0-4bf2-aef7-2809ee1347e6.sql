-- Add country and address fields to employees table
ALTER TABLE public.employees 
ADD COLUMN country TEXT NOT NULL DEFAULT 'United States',
ADD COLUMN address TEXT;

-- Create index for country filtering
CREATE INDEX idx_employees_country ON public.employees(country);