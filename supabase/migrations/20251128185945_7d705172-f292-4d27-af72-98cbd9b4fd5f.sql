-- Create employees table for HR management
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contractor')),
  salary_type TEXT NOT NULL CHECK (salary_type IN ('weekly', 'monthly', 'annual')),
  salary_amount NUMERIC(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  gusto_employee_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Only admins can manage employees
CREATE POLICY "Only admins can manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create index for active employees
CREATE INDEX idx_employees_is_active ON public.employees(is_active);

-- Create index for gusto sync
CREATE INDEX idx_employees_gusto_id ON public.employees(gusto_employee_id);

-- Add updated_at trigger
CREATE TRIGGER handle_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();