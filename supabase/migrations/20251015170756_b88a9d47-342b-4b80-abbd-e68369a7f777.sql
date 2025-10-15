-- Add foreign key constraints to tickets table for proper joins
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_created_by_fkey,
DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey,
DROP CONSTRAINT IF EXISTS tickets_category_id_fkey;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;