-- Update notification creation function to include update preview
CREATE OR REPLACE FUNCTION create_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user UUID;
  mentioned_users UUID[];
  opportunity_name TEXT;
  author_name TEXT;
  content_preview TEXT;
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
  
  -- Create a preview of the content (first 100 characters)
  -- Remove mention format @[Name](uuid) for cleaner preview
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
        related_opportunity_id,
        created_by
      ) VALUES (
        mentioned_user,
        'mention',
        author_name || ' mentioned you in ' || opportunity_name,
        content_preview,
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