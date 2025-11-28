-- Fix search path for extract_mentioned_users function
CREATE OR REPLACE FUNCTION extract_mentioned_users(content TEXT)
RETURNS UUID[] 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_users UUID[];
BEGIN
  -- Extract UUIDs from mentions in format @[Name](uuid)
  SELECT ARRAY_AGG(DISTINCT (regexp_matches(content, '@\[.*?\]\(([a-f0-9-]{36})\)', 'g'))[1]::uuid)
  INTO mentioned_users
  FROM regexp_matches(content, '@\[.*?\]\(([a-f0-9-]{36})\)', 'g');
  
  RETURN COALESCE(mentioned_users, ARRAY[]::UUID[]);
END;
$$;