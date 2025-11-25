-- Add notification preferences to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_on_new_message": true,
  "email_on_invoice_due": true,
  "email_on_project_update": true
}'::jsonb;

COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences for emails and alerts';