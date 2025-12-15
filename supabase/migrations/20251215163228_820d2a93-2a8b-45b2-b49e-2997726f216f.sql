-- Create project_updates table for unified activity feed
CREATE TABLE public.project_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add notes column to project_meetings
ALTER TABLE public.project_meetings ADD COLUMN IF NOT EXISTS notes TEXT;

-- Enable RLS on project_updates
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_updates
CREATE POLICY "Admins agents sales agents can manage project updates"
ON public.project_updates
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'agent'::app_role) OR 
  has_role(auth.uid(), 'sales_agent'::app_role)
);

CREATE POLICY "Project participants can create updates"
ON public.project_updates
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_updates.project_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'agent'::app_role) OR
      has_role(auth.uid(), 'sales_agent'::app_role) OR
      p.owner_id = auth.uid() OR
      p.created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM project_team_members ptm WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can view updates for their projects"
ON public.project_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_updates.project_id
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'agent'::app_role) OR
      has_role(auth.uid(), 'sales_agent'::app_role) OR
      p.owner_id = auth.uid() OR
      p.created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM project_team_members ptm WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid())
    )
  )
);

-- Enable realtime for project_updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_updates;

-- Create trigger for @mention notifications in project updates
CREATE OR REPLACE FUNCTION public.create_project_mention_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_user UUID;
  mentioned_users UUID[];
  project_name TEXT;
  author_name TEXT;
  content_preview TEXT;
BEGIN
  -- Get mentioned users
  mentioned_users := extract_mentioned_users(NEW.content);
  
  -- Get project name and author name for notification content
  SELECT p.name INTO project_name
  FROM projects p
  WHERE p.id = NEW.project_id;
  
  SELECT COALESCE(pr.full_name, pr.email) INTO author_name
  FROM profiles pr
  WHERE pr.id = NEW.created_by;
  
  -- Create a preview of the content (first 100 characters)
  content_preview := LEFT(regexp_replace(NEW.content, '@\[([^\]]+)\]\([a-f0-9-]{36}\)', '@\1', 'g'), 100);
  IF LENGTH(NEW.content) > 100 THEN
    content_preview := content_preview || '...';
  END IF;
  
  -- Create notification for each mentioned user (excluding the author)
  FOREACH mentioned_user IN ARRAY mentioned_users
  LOOP
    IF mentioned_user != NEW.created_by THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        metadata,
        created_by
      ) VALUES (
        mentioned_user,
        'mention',
        author_name || ' mentioned you in ' || project_name,
        content_preview,
        jsonb_build_object(
          'update_id', NEW.id,
          'project_id', NEW.project_id,
          'project_name', project_name
        ),
        NEW.created_by
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER create_project_update_mention_notifications
AFTER INSERT ON public.project_updates
FOR EACH ROW
EXECUTE FUNCTION public.create_project_mention_notifications();

-- Add indexes for performance
CREATE INDEX idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX idx_project_updates_created_at ON public.project_updates(created_at DESC);