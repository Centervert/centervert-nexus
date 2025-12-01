-- Add RLS policy for income table (admin-only access)
CREATE POLICY "Only admins can manage income"
ON public.income
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add RLS policy for expenses table (was missing)
CREATE POLICY "Only admins can manage expenses"
ON public.expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));