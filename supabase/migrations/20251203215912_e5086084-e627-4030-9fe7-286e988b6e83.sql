-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view roles securely" ON public.user_roles;

-- Create a permissive SELECT policy so users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role)
);