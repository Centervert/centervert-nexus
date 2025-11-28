-- Create enum for Bill.com activity types
CREATE TYPE billcom_activity_type AS ENUM (
  'customer_linked',
  'customer_auto_linked',
  'invoice_synced',
  'sync_completed',
  'sync_failed',
  'manual_link'
);

-- Create Bill.com sync logs table
CREATE TABLE billcom_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  activity_type billcom_activity_type NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_billcom_logs_org_id ON billcom_sync_logs(organization_id);
CREATE INDEX idx_billcom_logs_created_at ON billcom_sync_logs(created_at DESC);
CREATE INDEX idx_billcom_logs_type ON billcom_sync_logs(activity_type);

-- Enable RLS
ALTER TABLE billcom_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and team members can view all logs"
ON billcom_sync_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "System can create logs"
ON billcom_sync_logs FOR INSERT
WITH CHECK (true);

-- Function to create sync log
CREATE OR REPLACE FUNCTION create_billcom_sync_log(
  p_organization_id UUID,
  p_activity_type billcom_activity_type,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO billcom_sync_logs (
    organization_id,
    activity_type,
    message,
    metadata,
    created_by
  ) VALUES (
    p_organization_id,
    p_activity_type,
    p_message,
    p_metadata,
    p_created_by
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;