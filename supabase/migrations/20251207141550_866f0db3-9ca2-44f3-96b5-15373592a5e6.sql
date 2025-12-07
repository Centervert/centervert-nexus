-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their project team members" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;

-- Recreate project_team_members SELECT policy without recursion
CREATE POLICY "Users can view their project team members" 
ON public.project_team_members 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role) 
  OR user_id = auth.uid()
);

-- Recreate projects SELECT policy without circular reference to project_team_members
CREATE POLICY "Users can view their projects" 
ON public.projects 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role) 
  OR owner_id = auth.uid() 
  OR created_by = auth.uid()
);