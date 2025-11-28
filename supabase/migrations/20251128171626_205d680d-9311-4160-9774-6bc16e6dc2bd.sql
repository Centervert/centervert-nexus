-- Clean up unused enums from deleted features (Dev Projects, Tickets, legacy Client system)

-- Drop unused enum types
DROP TYPE IF EXISTS client_access_level CASCADE;
DROP TYPE IF EXISTS client_type CASCADE;
DROP TYPE IF EXISTS dev_build_environment CASCADE;
DROP TYPE IF EXISTS dev_build_status CASCADE;
DROP TYPE IF EXISTS dev_project_status CASCADE;
DROP TYPE IF EXISTS dev_project_type CASCADE;
DROP TYPE IF EXISTS dev_sprint_status CASCADE;
DROP TYPE IF EXISTS dev_task_status CASCADE;
DROP TYPE IF EXISTS dev_task_type CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;

-- Note: recurring_invoice_templates table is kept as it will be used for MCP client recurring billing feature