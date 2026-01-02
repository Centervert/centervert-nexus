-- Re-enable RLS on expenses table (was disabled in a previous migration)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;