-- Create income table for tracking income sources
CREATE TABLE public.income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Project', 'Retainer', 'Recurring Service', 'One-Time', 'Other'
  status TEXT NOT NULL DEFAULT 'projected', -- 'verified' or 'projected'
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL, -- 'One-Time', 'Weekly', 'Monthly', 'Quarterly', 'Annually'
  projected_start_date DATE NULL,
  end_date DATE NULL,
  notes TEXT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NULL
);

-- Add index for common queries
CREATE INDEX idx_income_status ON public.income(status);
CREATE INDEX idx_income_is_active ON public.income(is_active);

-- Enable RLS but allow all for now (admin-only via frontend routing)
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON public.income
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();