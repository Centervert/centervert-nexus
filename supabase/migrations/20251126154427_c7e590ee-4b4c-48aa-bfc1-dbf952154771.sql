-- Complete cleanup migration: Remove unused features
-- This keeps only Tickets and Client Portal essentials

-- First, drop all foreign key constraints that reference tables we're about to drop
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_managed_service_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;

-- Drop Managed Services tables
DROP TABLE IF EXISTS managed_services CASCADE;

-- Drop Opportunities tables
DROP TABLE IF EXISTS opportunity_work_sessions CASCADE;
DROP TABLE IF EXISTS opportunity_tasks CASCADE;
DROP TABLE IF EXISTS opportunity_quote_items CASCADE;
DROP TABLE IF EXISTS opportunity_message_reactions CASCADE;
DROP TABLE IF EXISTS opportunity_message_read_receipts CASCADE;
DROP TABLE IF EXISTS opportunity_messages CASCADE;
DROP TABLE IF EXISTS opportunity_document_links CASCADE;
DROP TABLE IF EXISTS opportunity_contacts CASCADE;
DROP TABLE IF EXISTS opportunity_attachments CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;

-- Drop Development/DevProjects tables
DROP TABLE IF EXISTS dev_task_time_logs CASCADE;
DROP TABLE IF EXISTS dev_task_comments CASCADE;
DROP TABLE IF EXISTS dev_tasks CASCADE;
DROP TABLE IF EXISTS dev_project_attachments CASCADE;
DROP TABLE IF EXISTS dev_sprints CASCADE;
DROP TABLE IF EXISTS dev_builds CASCADE;
DROP TABLE IF EXISTS dev_projects CASCADE;

-- Drop old Contacts/Clients tables (we'll rebuild HubSpot-style)
DROP TABLE IF EXISTS client_contacts CASCADE;
DROP TABLE IF EXISTS client_users CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Remove managed_service_id column from tickets since we dropped that table
ALTER TABLE tickets DROP COLUMN IF EXISTS managed_service_id;

-- Make client_id nullable temporarily (we'll rebuild clients table later)
ALTER TABLE tickets ALTER COLUMN client_id DROP NOT NULL;

-- Drop the old generate_opportunity_number function
DROP FUNCTION IF EXISTS generate_opportunity_number() CASCADE;
DROP FUNCTION IF EXISTS set_opportunity_number() CASCADE;
DROP FUNCTION IF EXISTS soft_delete_client(uuid) CASCADE;
DROP FUNCTION IF EXISTS restore_client(uuid) CASCADE;
DROP FUNCTION IF EXISTS sync_profile_company() CASCADE;
DROP FUNCTION IF EXISTS calculate_billing_start_date(timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS get_total_mrr() CASCADE;