
-- =====================================================
-- PROJECT MANAGEMENT SYSTEM - PHASE 1: DATABASE SCHEMA
-- Create tables first, then add RLS policies
-- =====================================================

-- 1. Create project_types table
CREATE TABLE public.project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  default_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  project_type_id UUID REFERENCES public.project_types(id),
  status TEXT NOT NULL DEFAULT 'active',
  health TEXT DEFAULT 'on_track',
  health_notes TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  contact_id UUID REFERENCES public.contacts(id),
  opportunity_id UUID REFERENCES public.opportunities(id),
  owner_id UUID REFERENCES public.profiles(id),
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  eod_required_roles JSONB DEFAULT '["Project Manager"]'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create project_team_members table
CREATE TABLE public.project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL,
  is_eod_required BOOLEAN DEFAULT false,
  added_by UUID REFERENCES public.profiles(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id, role)
);

-- 4. Create project_sprints table
CREATE TABLE public.project_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  sprint_number INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, sprint_number)
);

-- 5. Create project_tasks table
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.project_sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT DEFAULT 'medium',
  story_points INTEGER,
  estimated_hours NUMERIC,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create project_task_assignees table
CREATE TABLE public.project_task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(task_id, user_id)
);

-- 7. Create project_daily_standups table
CREATE TABLE public.project_daily_standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  standup_date DATE NOT NULL,
  work_performed BOOLEAN NOT NULL DEFAULT true,
  accomplishments TEXT,
  blockers TEXT,
  tomorrow_plan TEXT,
  no_work_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id, standup_date)
);

-- 8. Create project_resources table
CREATE TABLE public.project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  url TEXT,
  description TEXT,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create project_meetings table
CREATE TABLE public.project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  location TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_organization ON public.projects(organization_id);
CREATE INDEX idx_project_team_members_project ON public.project_team_members(project_id);
CREATE INDEX idx_project_team_members_user ON public.project_team_members(user_id);
CREATE INDEX idx_project_sprints_project ON public.project_sprints(project_id);
CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_sprint ON public.project_tasks(sprint_id);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX idx_project_task_assignees_task ON public.project_task_assignees(task_id);
CREATE INDEX idx_project_task_assignees_user ON public.project_task_assignees(user_id);
CREATE INDEX idx_project_daily_standups_project ON public.project_daily_standups(project_id);
CREATE INDEX idx_project_daily_standups_user ON public.project_daily_standups(user_id);
CREATE INDEX idx_project_daily_standups_date ON public.project_daily_standups(standup_date);
CREATE INDEX idx_project_resources_project ON public.project_resources(project_id);
CREATE INDEX idx_project_meetings_project ON public.project_meetings(project_id);
CREATE INDEX idx_project_meetings_start ON public.project_meetings(start_time);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_daily_standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROJECT_TYPES
-- =====================================================
CREATE POLICY "Authenticated users can view project types"
ON public.project_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage project types"
ON public.project_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- RLS POLICIES - PROJECTS
-- =====================================================
CREATE POLICY "Admins agents sales agents can manage projects"
ON public.projects FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their projects"
ON public.projects FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_team_members ptm
    WHERE ptm.project_id = projects.id AND ptm.user_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES - PROJECT_TEAM_MEMBERS
-- =====================================================
CREATE POLICY "Admins agents sales agents can manage project team"
ON public.project_team_members FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their project team members"
ON public.project_team_members FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_team_members.project_id 
    AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
  )
);

-- =====================================================
-- RLS POLICIES - PROJECT_SPRINTS
-- =====================================================
CREATE POLICY "Admins agents sales agents can manage sprints"
ON public.project_sprints FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their project sprints"
ON public.project_sprints FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_sprints.project_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role) 
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR p.owner_id = auth.uid() 
      OR p.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_team_members ptm 
        WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- RLS POLICIES - PROJECT_TASKS
-- =====================================================
CREATE POLICY "Admins agents sales agents can manage tasks"
ON public.project_tasks FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their project tasks"
ON public.project_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_tasks.project_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role) 
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR p.owner_id = auth.uid() 
      OR p.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_team_members ptm 
        WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Team members can update tasks"
ON public.project_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_team_members ptm 
    WHERE ptm.project_id = project_tasks.project_id AND ptm.user_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES - PROJECT_TASK_ASSIGNEES
-- =====================================================
CREATE POLICY "Admins agents sales agents can manage task assignees"
ON public.project_task_assignees FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their task assignees"
ON public.project_task_assignees FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_tasks pt
    JOIN public.projects p ON p.id = pt.project_id
    WHERE pt.id = project_task_assignees.task_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role) 
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR p.owner_id = auth.uid() 
      OR p.created_by = auth.uid()
    )
  )
);

-- =====================================================
-- RLS POLICIES - PROJECT_DAILY_STANDUPS
-- =====================================================
CREATE POLICY "Users can create their own standups"
ON public.project_daily_standups FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own standups"
ON public.project_daily_standups FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins agents sales agents can view all standups"
ON public.project_daily_standups FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their project standups"
ON public.project_daily_standups FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_daily_standups.project_id 
    AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.project_team_members ptm
    WHERE ptm.project_id = project_daily_standups.project_id AND ptm.user_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES - PROJECT_RESOURCES
-- =====================================================
CREATE POLICY "Admins agents sales agents can manage resources"
ON public.project_resources FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their project resources"
ON public.project_resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_resources.project_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role) 
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR p.owner_id = auth.uid() 
      OR p.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_team_members ptm 
        WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- RLS POLICIES - PROJECT_MEETINGS
-- =====================================================
CREATE POLICY "Admins agents sales agents can manage meetings"
ON public.project_meetings FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'agent'::app_role) 
  OR has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Users can view their project meetings"
ON public.project_meetings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_meetings.project_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'agent'::app_role) 
      OR has_role(auth.uid(), 'sales_agent'::app_role)
      OR p.owner_id = auth.uid() 
      OR p.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_team_members ptm 
        WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-resources', 'project-resources', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins agents sales agents can upload project resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-resources' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'agent'::app_role) 
    OR has_role(auth.uid(), 'sales_agent'::app_role)
  )
);

CREATE POLICY "Admins agents sales agents can view project resources files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-resources' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'agent'::app_role) 
    OR has_role(auth.uid(), 'sales_agent'::app_role)
  )
);

CREATE POLICY "Admins agents sales agents can delete project resources files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-resources' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'agent'::app_role) 
    OR has_role(auth.uid(), 'sales_agent'::app_role)
  )
);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_project_tasks_updated_at
BEFORE UPDATE ON public.project_tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SEED DATA - Project Types
-- =====================================================
INSERT INTO public.project_types (name, display_name, default_roles) VALUES
  ('development', 'Development', '["Project Manager", "UX/UI Lead", "Frontend Lead", "Backend Lead", "QA Lead"]'),
  ('msp', 'MSP/Retainer', '["Project Manager", "Account Manager", "Technical Lead"]'),
  ('consulting', 'Consulting', '["Project Manager", "Lead Consultant", "Analyst"]'),
  ('general', 'General', '["Project Manager"]');
