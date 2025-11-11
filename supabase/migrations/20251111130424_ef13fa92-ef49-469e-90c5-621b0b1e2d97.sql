-- Create opportunity_tasks table for open tasks
CREATE TABLE opportunity_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opportunity_work_sessions table for logging work
CREATE TABLE opportunity_work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  task_id UUID REFERENCES opportunity_tasks(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  duration_minutes NUMERIC NOT NULL,
  notes TEXT,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  logged_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE opportunity_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_work_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for opportunity_tasks
CREATE POLICY "Admins can manage opportunity tasks"
  ON opportunity_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for opportunity_work_sessions
CREATE POLICY "Admins can manage opportunity work sessions"
  ON opportunity_work_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_opportunity_tasks_opportunity_id ON opportunity_tasks(opportunity_id);
CREATE INDEX idx_opportunity_tasks_status ON opportunity_tasks(status);
CREATE INDEX idx_opportunity_work_sessions_opportunity_id ON opportunity_work_sessions(opportunity_id);
CREATE INDEX idx_opportunity_work_sessions_task_id ON opportunity_work_sessions(task_id);

-- Create triggers for updated_at
CREATE TRIGGER update_opportunity_tasks_updated_at
  BEFORE UPDATE ON opportunity_tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_opportunity_work_sessions_updated_at
  BEFORE UPDATE ON opportunity_work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();