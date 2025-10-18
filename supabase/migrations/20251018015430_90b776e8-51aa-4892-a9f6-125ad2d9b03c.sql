-- Add payment configuration to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS po_system_enabled boolean DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS default_payment_method text DEFAULT 'offline_check' 
  CHECK (default_payment_method IN ('stripe', 'offline_direct_deposit', 'offline_check', 'offline_cash', 'po_system'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS offline_payment_instructions text;

-- Reset ticket numbering to start at 10000001
ALTER SEQUENCE tickets_ticket_number_seq RESTART WITH 10000001;

-- Add payment status tracking to ticket_quotes
ALTER TABLE ticket_quotes ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' 
  CHECK (payment_status IN ('unpaid', 'paid', 'pending'));
ALTER TABLE ticket_quotes ADD COLUMN IF NOT EXISTS marked_paid_by uuid REFERENCES profiles(id);
ALTER TABLE ticket_quotes ADD COLUMN IF NOT EXISTS marked_paid_at timestamp with time zone;

-- Set up Ridge Media as agency managing Xulon Press
UPDATE clients 
SET managing_agency_id = (SELECT id FROM clients WHERE name = 'Ridge Media, LLC')
WHERE name = 'Xulon Press';

-- Data cleanup: Update system_settings to point to Tyler Amos before deleting other users
UPDATE system_settings 
SET updated_by = (SELECT id FROM profiles WHERE email = 'tyleramos@proton.me')
WHERE updated_by IN (
  SELECT id FROM profiles WHERE email != 'tyleramos@proton.me'
);

-- Data cleanup: Delete all users except Tyler Amos
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM profiles WHERE email != 'tyleramos@proton.me'
);
DELETE FROM profiles WHERE email != 'tyleramos@proton.me';

-- Data cleanup: Keep only the specified ticket
DELETE FROM ticket_quotes WHERE ticket_id NOT IN (
  SELECT id FROM tickets WHERE title = 'Complete AuthorServices.com with Xulon Landing Pages'
);
DELETE FROM ticket_messages WHERE ticket_id NOT IN (
  SELECT id FROM tickets WHERE title = 'Complete AuthorServices.com with Xulon Landing Pages'
);
DELETE FROM ticket_milestones WHERE ticket_id NOT IN (
  SELECT id FROM tickets WHERE title = 'Complete AuthorServices.com with Xulon Landing Pages'
);
DELETE FROM ticket_links WHERE ticket_id NOT IN (
  SELECT id FROM tickets WHERE title = 'Complete AuthorServices.com with Xulon Landing Pages'
);
DELETE FROM attachments WHERE ticket_id NOT IN (
  SELECT id FROM tickets WHERE title = 'Complete AuthorServices.com with Xulon Landing Pages'
);
DELETE FROM comments WHERE ticket_id NOT IN (
  SELECT id FROM tickets WHERE title = 'Complete AuthorServices.com with Xulon Landing Pages'
);
DELETE FROM tickets WHERE title != 'Complete AuthorServices.com with Xulon Landing Pages';

-- Ensure Tyler Amos has client_id set to Ridge Media
UPDATE profiles 
SET client_id = (SELECT id FROM clients WHERE name = 'Ridge Media, LLC')
WHERE email = 'tyleramos@proton.me' AND client_id IS NULL;