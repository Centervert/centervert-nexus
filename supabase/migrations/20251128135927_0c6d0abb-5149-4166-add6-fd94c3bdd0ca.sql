-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  related_opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Function to extract mentioned user IDs from content
-- Assumes mentions are in format: @[Display Name](user_id)
CREATE OR REPLACE FUNCTION extract_mentioned_users(content TEXT)
RETURNS UUID[] AS $$
DECLARE
  mentioned_users UUID[];
BEGIN
  -- Extract UUIDs from mentions in format @[Name](uuid)
  SELECT ARRAY_AGG(DISTINCT (regexp_matches(content, '@\[.*?\]\(([a-f0-9-]{36})\)', 'g'))[1]::uuid)
  INTO mentioned_users
  FROM regexp_matches(content, '@\[.*?\]\(([a-f0-9-]{36})\)', 'g');
  
  RETURN COALESCE(mentioned_users, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql;

-- Function to create mention notifications
CREATE OR REPLACE FUNCTION create_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user UUID;
  mentioned_users UUID[];
  opportunity_name TEXT;
  author_name TEXT;
BEGIN
  -- Get mentioned users
  mentioned_users := extract_mentioned_users(NEW.content);
  
  -- Get opportunity name and author name for notification content
  SELECT o.name INTO opportunity_name
  FROM opportunities o
  WHERE o.id = NEW.opportunity_id;
  
  SELECT COALESCE(p.full_name, p.email) INTO author_name
  FROM profiles p
  WHERE p.id = NEW.created_by;
  
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
        related_opportunity_id,
        created_by
      ) VALUES (
        mentioned_user,
        'mention',
        'You were mentioned in ' || opportunity_name,
        author_name || ' mentioned you in an update',
        jsonb_build_object(
          'update_id', NEW.id,
          'opportunity_id', NEW.opportunity_id,
          'opportunity_name', opportunity_name
        ),
        NEW.opportunity_id,
        NEW.created_by
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create notifications on new updates
CREATE TRIGGER on_opportunity_update_created
  AFTER INSERT ON opportunity_updates
  FOR EACH ROW
  EXECUTE FUNCTION create_mention_notifications();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;