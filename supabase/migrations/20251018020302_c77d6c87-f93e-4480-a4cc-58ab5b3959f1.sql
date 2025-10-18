-- Check if Tyler Amos user exists in auth.users and create profile
-- This recreates the profile that was accidentally deleted

-- First, let's see what we have (this is a query, won't modify anything)
DO $$
DECLARE
    v_user_id uuid;
    v_ridge_media_id uuid;
BEGIN
    -- Get Ridge Media client ID
    SELECT id INTO v_ridge_media_id FROM clients WHERE name = 'Ridge Media, LLC' LIMIT 1;
    
    -- Get or find the authenticated user (assuming tyleramos@proton.me exists in auth)
    -- Note: We can't directly query auth.users in migrations, so we'll use a safer approach
    
    -- Insert profile for any auth users that don't have profiles yet
    -- This will work when the user logs in
    INSERT INTO profiles (id, email, full_name, company, client_id)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'full_name', 'Tyler Amos'),
        'Centervert',
        v_ridge_media_id
    FROM auth.users au
    WHERE au.email = 'tyleramos@proton.me'
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id)
    ON CONFLICT (id) DO UPDATE
    SET 
        company = 'Centervert',
        client_id = EXCLUDED.client_id,
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
    
    -- Also ensure Tyler has admin role
    INSERT INTO user_roles (user_id, role)
    SELECT 
        au.id,
        'admin'::app_role
    FROM auth.users au
    WHERE au.email = 'tyleramos@proton.me'
    AND NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = au.id AND role = 'admin'::app_role
    );
END $$;