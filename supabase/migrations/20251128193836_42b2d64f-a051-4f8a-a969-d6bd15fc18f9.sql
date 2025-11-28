-- Create employee_raises table for tracking salary changes
CREATE TABLE IF NOT EXISTS public.employee_raises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  current_salary NUMERIC NOT NULL,
  raise_amount NUMERIC NOT NULL,
  new_salary NUMERIC NOT NULL,
  effective_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'canceled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for employee lookups
CREATE INDEX idx_employee_raises_employee_id ON public.employee_raises(employee_id);

-- Enable RLS
ALTER TABLE public.employee_raises ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only)
CREATE POLICY "Only admins can manage raises"
  ON public.employee_raises
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_employee_raises_updated_at
  BEFORE UPDATE ON public.employee_raises
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();