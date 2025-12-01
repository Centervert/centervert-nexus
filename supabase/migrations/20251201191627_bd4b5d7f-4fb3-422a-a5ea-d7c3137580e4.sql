-- Table to link income to existing expenses or projected expenses
CREATE TABLE public.income_associated_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_id UUID NOT NULL REFERENCES public.income(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  -- For projected expenses that don't exist in expenses table
  projected_expense_name TEXT,
  projected_expense_amount NUMERIC,
  projected_expense_frequency TEXT,
  is_projected BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_income_expense UNIQUE(income_id, expense_id)
);

-- Table to link income to employees
CREATE TABLE public.income_employee_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_id UUID NOT NULL REFERENCES public.income(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  allocation_percentage NUMERIC DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_income_employee UNIQUE(income_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.income_associated_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_employee_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies - admin only (matching income table)
CREATE POLICY "Only admins can manage income associated expenses"
ON public.income_associated_expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage income employee costs"
ON public.income_employee_costs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));