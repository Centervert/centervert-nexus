-- Fix the extract_mentioned_users function to avoid aggregate function issues
CREATE OR REPLACE FUNCTION public.extract_mentioned_users(content text)
 RETURNS uuid[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  mentioned_users UUID[];
  match_result TEXT[];
  user_id TEXT;
BEGIN
  -- Extract UUIDs from mentions in format @[Name](uuid) using a different approach
  mentioned_users := ARRAY[]::UUID[];
  
  FOR match_result IN 
    SELECT regexp_matches(content, '@\[.*?\]\(([a-f0-9-]{36})\)', 'g')
  LOOP
    user_id := match_result[1];
    IF user_id IS NOT NULL AND user_id::uuid IS NOT NULL THEN
      -- Add to array if not already present
      IF NOT (user_id::uuid = ANY(mentioned_users)) THEN
        mentioned_users := array_append(mentioned_users, user_id::uuid);
      END IF;
    END IF;
  END LOOP;
  
  RETURN mentioned_users;
EXCEPTION
  WHEN OTHERS THEN
    -- Return empty array on any error
    RETURN ARRAY[]::UUID[];
END;
$$;