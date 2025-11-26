-- Rename companies table to organizations
ALTER TABLE companies RENAME TO organizations;

-- Update foreign key references in contacts table
ALTER TABLE contacts RENAME COLUMN company_id TO organization_id;

-- Update foreign key references in profiles table  
ALTER TABLE profiles RENAME COLUMN company_id TO organization_id;

-- Update foreign key references in invitations table
ALTER TABLE invitations RENAME COLUMN company_id TO organization_id;

-- Update index names
ALTER INDEX idx_companies_organization_type RENAME TO idx_organizations_organization_type;