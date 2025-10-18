-- Set up admin account for tyler@centervert.com
-- This will configure the profile and role when the user signs up

DO $$
DECLARE
    v_ridge_media_id uuid;
BEGIN
    -- Get Ridge Media client ID
    SELECT id INTO v_ridge_media_id FROM clients WHERE name = 'Ridge Media, LLC' LIMIT 1;
    
    -- Update or insert profile for tyler@centervert.com if they've signed up
    INSERT INTO profiles (id, email, full_name, company, client_id)
    SELECT 
        au.id,
        au.email,
        'Tyler Amos',
        'Centervert',
        v_ridge_media_id
    FROM auth.users au
    WHERE au.email = 'tyler@centervert.com'
    ON CONFLICT (id) DO UPDATE
    SET 
        company = 'Centervert',
        client_id = EXCLUDED.client_id,
        full_name = 'Tyler Amos';
    
    -- Ensure tyler@centervert.com has admin role
    INSERT INTO user_roles (user_id, role)
    SELECT 
        au.id,
        'admin'::app_role
    FROM auth.users au
    WHERE au.email = 'tyler@centervert.com'
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;