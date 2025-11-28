-- Add 'owner' to employment_type enum
ALTER TABLE public.employees 
DROP CONSTRAINT employees_employment_type_check;

ALTER TABLE public.employees
ADD CONSTRAINT employees_employment_type_check 
CHECK (employment_type IN ('full-time', 'part-time', 'contractor', 'owner'));