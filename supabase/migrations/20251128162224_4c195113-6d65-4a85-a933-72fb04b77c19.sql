-- Add billcom_customer_id to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billcom_customer_id TEXT;

-- Create invoice status enum
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'partial',
  'paid',
  'overdue',
  'void'
);

-- Create frequency enum for recurring invoices
CREATE TYPE invoice_frequency AS ENUM (
  'weekly',
  'monthly',
  'quarterly',
  'annually'
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  billcom_invoice_id TEXT UNIQUE,
  invoice_number TEXT,
  status invoice_status NOT NULL DEFAULT 'draft',
  amount DECIMAL(12, 2) NOT NULL,
  amount_due DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  issue_date DATE,
  due_date DATE,
  paid_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  billcom_payment_link TEXT,
  billcom_pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  billcom_payment_id TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method TEXT,
  status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recurring_invoice_templates table
CREATE TABLE recurring_invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  billcom_recurring_id TEXT,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  frequency invoice_frequency NOT NULL,
  next_invoice_date DATE,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_billcom_id ON invoices(billcom_invoice_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_recurring_templates_org_id ON recurring_invoice_templates(organization_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Admins can manage all invoices"
ON invoices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view all invoices"
ON invoices FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Organizations can view their own invoices"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.organization_id = invoices.organization_id
  )
);

-- RLS Policies for payments
CREATE POLICY "Admins can manage all payments"
ON payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view all payments"
ON payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Organizations can view their own payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices
    JOIN profiles ON profiles.organization_id = invoices.organization_id
    WHERE invoices.id = payments.invoice_id
    AND profiles.id = auth.uid()
  )
);

-- RLS Policies for recurring_invoice_templates
CREATE POLICY "Admins can manage all templates"
ON recurring_invoice_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view all templates"
ON recurring_invoice_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_recurring_templates_updated_at
  BEFORE UPDATE ON recurring_invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();