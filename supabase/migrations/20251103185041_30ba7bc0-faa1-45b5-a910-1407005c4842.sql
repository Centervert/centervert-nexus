-- Create enums for development tracking system
CREATE TYPE public.dev_project_type AS ENUM (
  'mobile_app',
  'web_app',
  'desktop_app',
  'api',
  'integration',
  'other'
);

CREATE TYPE public.dev_project_status AS ENUM (
  'planning',
  'in_development',
  'testing',
  'staging',
  'production',
  'maintenance',
  'archived'
);

CREATE TYPE public.dev_sprint_status AS ENUM (
  'planned',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE public.dev_task_type AS ENUM (
  'feature',
  'bug',
  'enhancement',
  'refactor',
  'documentation',
  'testing',
  'devops'
);

CREATE TYPE public.dev_task_status AS ENUM (
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'testing',
  'done',
  'blocked'
);

CREATE TYPE public.dev_build_environment AS ENUM (
  'development',
  'staging',
  'production'
);

CREATE TYPE public.dev_build_status AS ENUM (
  'building',
  'success',
  'failed',
  'deploying',
  'deployed'
);

-- Create dev_projects table
CREATE TABLE public.dev_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number SERIAL UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type dev_project_type NOT NULL,
  platform TEXT[],
  tech_stack JSONB,
  status dev_project_status NOT NULL DEFAULT 'planning',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lead_developer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_members UUID[],
  repository_url TEXT,
  staging_url TEXT,
  production_url TEXT,
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  budget NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  target_launch_date TIMESTAMP WITH TIME ZONE,
  actual_launch_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL
);

-- Create dev_sprints table
CREATE TABLE public.dev_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.dev_projects(id) ON DELETE CASCADE NOT NULL,
  sprint_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  goal TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status dev_sprint_status NOT NULL DEFAULT 'planned',
  velocity_points INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, sprint_number)
);

-- Create dev_tasks table
CREATE TABLE public.dev_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number SERIAL UNIQUE NOT NULL,
  project_id UUID REFERENCES public.dev_projects(id) ON DELETE CASCADE NOT NULL,
  sprint_id UUID REFERENCES public.dev_sprints(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.dev_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type dev_task_type NOT NULL DEFAULT 'feature',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status dev_task_status NOT NULL DEFAULT 'backlog',
  story_points INTEGER,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  acceptance_criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL
);

-- Create dev_builds table
CREATE TABLE public.dev_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.dev_projects(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,
  build_number INTEGER NOT NULL,
  environment dev_build_environment NOT NULL,
  status dev_build_status NOT NULL DEFAULT 'building',
  commit_hash TEXT,
  branch TEXT,
  release_notes TEXT,
  deployed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deployed_at TIMESTAMP WITH TIME ZONE,
  build_log_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dev_task_comments table
CREATE TABLE public.dev_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.dev_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mentions UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dev_task_time_logs table
CREATE TABLE public.dev_task_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.dev_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hours NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dev_project_attachments table
CREATE TABLE public.dev_project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.dev_projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.dev_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.dev_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_project_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access for all tables

-- dev_projects policies
CREATE POLICY "Admins can view all dev projects"
ON public.dev_projects FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage dev projects"
ON public.dev_projects FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- dev_sprints policies
CREATE POLICY "Admins can view all sprints"
ON public.dev_sprints FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sprints"
ON public.dev_sprints FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- dev_tasks policies
CREATE POLICY "Admins can view all dev tasks"
ON public.dev_tasks FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage dev tasks"
ON public.dev_tasks FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- dev_builds policies
CREATE POLICY "Admins can view all builds"
ON public.dev_builds FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage builds"
ON public.dev_builds FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- dev_task_comments policies
CREATE POLICY "Admins can view all task comments"
ON public.dev_task_comments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage task comments"
ON public.dev_task_comments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- dev_task_time_logs policies
CREATE POLICY "Admins can view all time logs"
ON public.dev_task_time_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage time logs"
ON public.dev_task_time_logs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- dev_project_attachments policies
CREATE POLICY "Admins can view all dev attachments"
ON public.dev_project_attachments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage dev attachments"
ON public.dev_project_attachments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_dev_projects_client_id ON public.dev_projects(client_id);
CREATE INDEX idx_dev_projects_status ON public.dev_projects(status);
CREATE INDEX idx_dev_projects_created_by ON public.dev_projects(created_by);

CREATE INDEX idx_dev_sprints_project_id ON public.dev_sprints(project_id);
CREATE INDEX idx_dev_sprints_status ON public.dev_sprints(status);

CREATE INDEX idx_dev_tasks_project_id ON public.dev_tasks(project_id);
CREATE INDEX idx_dev_tasks_sprint_id ON public.dev_tasks(sprint_id);
CREATE INDEX idx_dev_tasks_assigned_to ON public.dev_tasks(assigned_to);
CREATE INDEX idx_dev_tasks_status ON public.dev_tasks(status);
CREATE INDEX idx_dev_tasks_parent_task_id ON public.dev_tasks(parent_task_id);

CREATE INDEX idx_dev_builds_project_id ON public.dev_builds(project_id);
CREATE INDEX idx_dev_builds_environment ON public.dev_builds(environment);

CREATE INDEX idx_dev_task_comments_task_id ON public.dev_task_comments(task_id);
CREATE INDEX idx_dev_task_comments_user_id ON public.dev_task_comments(user_id);

CREATE INDEX idx_dev_task_time_logs_task_id ON public.dev_task_time_logs(task_id);
CREATE INDEX idx_dev_task_time_logs_user_id ON public.dev_task_time_logs(user_id);

CREATE INDEX idx_dev_project_attachments_project_id ON public.dev_project_attachments(project_id);
CREATE INDEX idx_dev_project_attachments_task_id ON public.dev_project_attachments(task_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_dev_projects_updated_at
  BEFORE UPDATE ON public.dev_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_dev_sprints_updated_at
  BEFORE UPDATE ON public.dev_sprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_dev_tasks_updated_at
  BEFORE UPDATE ON public.dev_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_dev_task_comments_updated_at
  BEFORE UPDATE ON public.dev_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for dev project attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('dev-project-attachments', 'dev-project-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies (admin-only)
CREATE POLICY "Admins can upload dev attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dev-project-attachments' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can view dev attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dev-project-attachments' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update dev attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dev-project-attachments' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete dev attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dev-project-attachments' 
  AND has_role(auth.uid(), 'admin')
);