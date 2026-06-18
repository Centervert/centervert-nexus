## Goal

Expose the entire portal to your AI agents via a single **MCP server** hosted as a Supabase Edge Function. Any MCP-compatible agent (Claude Desktop, Cursor, your custom agent, n8n, etc.) connects to one URL, authenticates with an admin API key, and gets typed tools to read/write everything.

## Architecture

```text
Your AI Agent ──HTTPS──> Edge Function: /functions/v1/mcp
                         (mcp-lite + Hono, Streamable HTTP transport)
                                │
                                ├─ Verify Authorization: Bearer <MCP_ADMIN_KEY>
                                └─ Supabase service-role client (bypasses RLS)
                                        │
                                        └─ CRM / Projects / Back Office / Billing tables
                                                + invoke existing edge functions
                                                  (sync-billcom-invoices, etc.)
```

- **Transport:** MCP Streamable HTTP via `mcp-lite` (v0.10+), the pattern Lovable recommends for Edge Functions.
- **Auth:** single `MCP_ADMIN_KEY` secret. Requests without `Authorization: Bearer <key>` return 401. JWT verification disabled on this function so non-Supabase agents can connect.
- **DB access:** `SUPABASE_SERVICE_ROLE_KEY` — full read/write, bypasses RLS as requested.
- **Audit log:** new `mcp_audit_log` table records every tool call (tool name, input, actor label, success/error, timestamp) so you can see what the agent did.

## Tools exposed (grouped)

**CRM**
- `list_contacts`, `get_contact`, `create_contact`, `update_contact`, `delete_contact`
- `list_organizations`, `get_organization`, `create_organization`, `update_organization`
- `list_deals`, `get_deal`, `create_deal`, `update_deal`, `add_deal_message`

**Projects**
- `list_projects`, `get_project`, `create_project`, `update_project`
- `list_project_tasks`, `create_project_task`, `update_project_task`, `assign_task`
- `list_sprints`, `create_sprint`, `add_project_update`, `add_project_decision`, `add_project_risk`

**Back Office**
- `list_employees`, `get_employee`, `create_employee`, `update_employee`
- `list_raises`, `create_raise`, `approve_raise`
- `list_expenses`, `create_expense`, `update_expense`
- `list_income`, `create_income`, `update_income`

**Billing**
- `list_invoices`, `get_invoice`, `list_billcom_sync_logs`
- `trigger_billcom_invoice_sync`, `trigger_billcom_customer_sync` (invoke existing edge functions)

**Meta**
- `search` — full-text-ish search across contacts/orgs/deals/projects
- `whoami` — returns server version + tool catalog summary

Every tool has a Zod-style `inputSchema`, validated server-side. Mutations return the updated row.

## Files to add

```text
supabase/functions/mcp/
  index.ts              # Hono + mcp-lite server, auth, tool registration
  deno.json             # pins mcp-lite ^0.10.0, hono, zod
  lib/
    auth.ts             # Bearer token check
    supabase.ts         # service-role client factory
    audit.ts            # writes mcp_audit_log
    tools/
      crm.ts            # contacts, orgs, deals tools
      projects.ts       # projects, tasks, sprints, updates tools
      backoffice.ts     # employees, raises, expenses, income tools
      billing.ts        # invoices + sync triggers
      meta.ts           # search, whoami
```

`supabase/config.toml` gets a `[functions.mcp]` block with `verify_jwt = false` so external agents can hit it with only the MCP admin key.

## Database changes (one migration)

```sql
CREATE TABLE public.mcp_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL,
  input jsonb,
  output_summary text,
  success boolean NOT NULL,
  error_message text,
  actor_label text,          -- optional X-Agent-Id header value
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mcp_audit_log TO authenticated;
GRANT ALL    ON public.mcp_audit_log TO service_role;
ALTER TABLE public.mcp_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON public.mcp_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

No other schema changes. All tools operate on existing tables.

## Secrets

- `MCP_ADMIN_KEY` — new secret, requested via the secrets tool. You'll paste this key into your agent's MCP client config.
- Reuses existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Frontend (small)

Add a **Settings → Integrations → MCP** page (admin-only) showing:
- The MCP endpoint URL (`https://<project>.supabase.co/functions/v1/mcp`)
- Example client config snippet (Claude Desktop / generic MCP)
- A button to view the last 50 entries from `mcp_audit_log`
- A "rotate key" button that opens the secrets update dialog

## Security notes (acknowledged)

You chose service/admin key with full RLS bypass. That means:
- Anyone with `MCP_ADMIN_KEY` can read/modify everything, including HR salary data and invoices.
- Audit log is the only accountability layer.
- Recommend storing the key only in your agent runtime; rotate if exposed.

I have updated the @security-memory note will be added after build to record this intentional bypass.

## Out of scope

- Per-user API keys / OAuth (you chose admin key).
- Outbound webhooks for events (can be added later if needed).
- Streaming long responses — tools return JSON synchronously.
- Rate limiting (Lovable has no standard primitive; can add ad‑hoc if you want).

## How you'll use it

In your agent's MCP client config:

```json
{
  "mcpServers": {
    "centervert": {
      "url": "https://<project>.supabase.co/functions/v1/mcp",
      "headers": { "Authorization": "Bearer <MCP_ADMIN_KEY>" }
    }
  }
}
```

Your agent will then see ~40 tools it can call to fully operate the portal.
