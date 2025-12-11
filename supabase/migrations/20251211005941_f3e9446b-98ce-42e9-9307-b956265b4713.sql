-- Add payment_account column to expenses
ALTER TABLE public.expenses 
ADD COLUMN payment_account text;

-- Optionally drop vendor column (or keep for historical data)
-- ALTER TABLE public.expenses DROP COLUMN vendor;