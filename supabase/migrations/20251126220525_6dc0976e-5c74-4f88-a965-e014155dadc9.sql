-- Add organization_type column to companies table
ALTER TABLE companies ADD COLUMN organization_type text CHECK (organization_type IN ('private_company', 'government', 'non_profit'));

-- Add index for organization_type for better query performance
CREATE INDEX idx_companies_organization_type ON companies(organization_type);