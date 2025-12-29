-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create project_features table (roadmap/milestones)
CREATE TABLE public.project_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  priority TEXT DEFAULT 'medium',
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_decisions table
CREATE TABLE public.project_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  decision TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_risks table
CREATE TABLE public.project_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  likelihood TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  mitigation TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to project_tasks
ALTER TABLE public.project_tasks 
ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS feature_id UUID REFERENCES public.project_features(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_pending BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.project_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_risks ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_features
CREATE POLICY "Admins agents sales agents can manage features"
ON public.project_features FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role));

CREATE POLICY "Users can view their project features"
ON public.project_features FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = project_features.project_id
  AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'sales_agent'::app_role) OR
    p.owner_id = auth.uid() OR
    p.created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM project_team_members ptm WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid())
  )
));

-- RLS policies for project_decisions
CREATE POLICY "Admins agents sales agents can manage decisions"
ON public.project_decisions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role));

CREATE POLICY "Users can view their project decisions"
ON public.project_decisions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = project_decisions.project_id
  AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'sales_agent'::app_role) OR
    p.owner_id = auth.uid() OR
    p.created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM project_team_members ptm WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid())
  )
));

-- RLS policies for project_risks
CREATE POLICY "Admins agents sales agents can manage risks"
ON public.project_risks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'sales_agent'::app_role));

CREATE POLICY "Users can view their project risks"
ON public.project_risks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = project_risks.project_id
  AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'agent'::app_role) OR
    has_role(auth.uid(), 'sales_agent'::app_role) OR
    p.owner_id = auth.uid() OR
    p.created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM project_team_members ptm WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid())
  )
));

-- Add updated_at triggers
CREATE TRIGGER update_project_features_updated_at
BEFORE UPDATE ON public.project_features
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_decisions_updated_at
BEFORE UPDATE ON public.project_decisions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_risks_updated_at
BEFORE UPDATE ON public.project_risks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_project_features_project_id ON public.project_features(project_id);
CREATE INDEX idx_project_decisions_project_id ON public.project_decisions(project_id);
CREATE INDEX idx_project_risks_project_id ON public.project_risks(project_id);
CREATE INDEX idx_project_tasks_feature_id ON public.project_tasks(feature_id);
CREATE INDEX idx_project_tasks_task_type ON public.project_tasks(task_type);