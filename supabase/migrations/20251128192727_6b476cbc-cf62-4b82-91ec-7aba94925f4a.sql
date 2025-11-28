-- Make start_date nullable in employees table
ALTER TABLE public.employees
ALTER COLUMN start_date DROP NOT NULL;