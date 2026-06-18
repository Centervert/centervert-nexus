CREATE TABLE public.mcp_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL,
  input jsonb,
  output_summary text,
  success boolean NOT NULL,
  error_message text,
  actor_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mcp_audit_log TO authenticated;
GRANT ALL ON public.mcp_audit_log TO service_role;
ALTER TABLE public.mcp_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view MCP audit log"
  ON public.mcp_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_mcp_audit_log_created_at ON public.mcp_audit_log (created_at DESC);
CREATE INDEX idx_mcp_audit_log_tool_name ON public.mcp_audit_log (tool_name);