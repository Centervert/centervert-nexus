// Agent Guide — a hidden HTML document describing the MCP surface for AI agents.
// Access:  GET /functions/v1/agent-guide?key=<MCP_ADMIN_KEY>
//     or:  GET /functions/v1/agent-guide with header  X-Agent-Key: <MCP_ADMIN_KEY>
//     or:  Authorization: Bearer <MCP_ADMIN_KEY>
// Rejects with 404 (not 401) on any mismatch so scanners can't fingerprint it.

const ADMIN_KEY = (Deno.env.get("MCP_ADMIN_KEY") ?? "").trim();

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function extractKey(req: Request): string {
  const url = new URL(req.url);
  const q = url.searchParams.get("key") ?? "";
  if (q) return q.trim();
  const h = req.headers.get("x-agent-key") ?? "";
  if (h) return h.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return "";
}

const notFound = () =>
  new Response("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain", "cache-control": "no-store" },
  });

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, x-agent-key",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }
  if (req.method !== "GET") return notFound();
  if (!ADMIN_KEY) return notFound();

  const provided = extractKey(req);
  if (!provided || !timingSafeEqual(provided, ADMIN_KEY)) return notFound();

  return new Response(HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "referrer-policy": "no-referrer",
    },
  });
});

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex, nofollow, noarchive" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Centervert — Agent Operating Guide</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #0f1115; color: #e6e6e6; }
  .wrap { max-width: 880px; margin: 0 auto; padding: 48px 24px 96px; }
  h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: -0.01em; }
  h2 { font-size: 20px; margin: 40px 0 12px; border-bottom: 1px solid #262a33; padding-bottom: 6px; }
  h3 { font-size: 16px; margin: 24px 0 8px; color: #cfd3dc; }
  code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
  code { background: #1a1d24; padding: 2px 6px; border-radius: 4px; color: #f0d8a8; }
  pre { background: #151820; padding: 14px 16px; border-radius: 8px; overflow-x: auto;
        border: 1px solid #262a33; }
  .lede { color: #9aa1ad; margin: 0 0 24px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px;
           background: #9c5126; color: #fff; font-size: 12px; letter-spacing: 0.03em; }
  .warn { background: #2a1c14; border: 1px solid #7a3d1c; padding: 12px 16px; border-radius: 8px; }
  ul { padding-left: 20px; }
  li { margin: 4px 0; }
  hr { border: 0; border-top: 1px solid #262a33; margin: 32px 0; }
  a { color: #f0a674; }
</style>
</head>
<body>
<div class="wrap">
  <span class="badge">CONFIDENTIAL · AGENT ONLY</span>
  <h1>Centervert — Agent Operating Guide</h1>
  <p class="lede">
    This document describes the MCP surface, expected conventions, and safety
    rules for AI agents operating against the Centervert portal. Treat this URL
    as a credential — anyone with the key can read it.
  </p>

  <h2>1. Endpoint</h2>
  <p>The MCP server speaks JSON-RPC 2.0 over HTTP (MCP Streamable HTTP).</p>
  <pre>POST https://&lt;project&gt;.supabase.co/functions/v1/mcp
Authorization: Bearer &lt;MCP_ADMIN_KEY&gt;
Content-Type: application/json
Accept: application/json, text/event-stream</pre>

  <h3>Handshake</h3>
  <pre>{"jsonrpc":"2.0","id":1,"method":"initialize",
 "params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"my-agent","version":"1.0"}}}

{"jsonrpc":"2.0","id":2,"method":"tools/list"}

{"jsonrpc":"2.0","id":3,"method":"tools/call",
 "params":{"name":"whoami","arguments":{}}}</pre>

  <h2>2. What you can do</h2>
  <p>Tools are grouped by domain. Always call <code>tools/list</code> first —
     it's the source of truth for names, arguments, and descriptions.</p>

  <h3>Meta</h3>
  <ul>
    <li><code>whoami</code> — confirm connectivity and identity.</li>
    <li><code>search</code> — cross-entity substring search (contacts, orgs, deals, projects, employees).</li>
  </ul>

  <h3>CRM</h3>
  <ul>
    <li>Contacts: <code>list_contacts</code>, <code>get_contact</code>, <code>create_contact</code>, <code>update_contact</code>, <code>delete_contact</code></li>
    <li>Organizations: <code>list_organizations</code>, <code>get_organization</code>, <code>create_organization</code>, <code>update_organization</code></li>
    <li>Deals (sales pipeline): <code>list_deals</code>, <code>get_deal</code>, <code>create_deal</code>, <code>update_deal</code>, <code>add_deal_message</code></li>
  </ul>

  <h3>Projects</h3>
  <ul>
    <li><code>list_projects</code>, <code>get_project</code>, <code>create_project</code>, <code>update_project</code></li>
    <li>Tasks: <code>list_project_tasks</code>, <code>create_project_task</code>, <code>update_project_task</code>, <code>assign_task</code></li>
    <li>Sprints: <code>list_sprints</code>, <code>create_sprint</code></li>
    <li>Updates / decisions / risks: <code>add_project_update</code>, <code>add_project_decision</code>, <code>add_project_risk</code></li>
  </ul>

  <h3>Human Resources</h3>
  <ul>
    <li>Employees: <code>list_employees</code>, <code>get_employee</code>, <code>create_employee</code>, <code>update_employee</code>, <code>delete_employee</code></li>
    <li>Compensation (source of truth — do not compute payroll manually):
        <code>list_employee_compensation</code>, <code>get_employee_compensation</code></li>
    <li>Raises: <code>list_raises</code>, <code>create_raise</code>, <code>approve_raise</code>, <code>update_raise</code>, <code>delete_raise</code>.
        <code>salary_type</code> must be <code>'weekly' | 'monthly' | 'annual'</code>.</li>
    <li>Notes: <code>list_employee_notes</code>, <code>add_employee_note</code>, <code>update_employee_note</code>, <code>delete_employee_note</code></li>
    <li>Attachments: <code>list_employee_attachments</code>, <code>delete_employee_attachment</code></li>
  </ul>

  <h3>Finance</h3>
  <ul>
    <li>Expenses: <code>list_expenses</code>, <code>create_expense</code>, <code>update_expense</code></li>
    <li>Income: <code>list_income</code>, <code>create_income</code>, <code>update_income</code></li>
    <li>Bill.com: <code>list_invoices</code>, <code>get_invoice</code>, <code>list_billcom_sync_logs</code>,
        <code>trigger_billcom_invoice_sync</code>, <code>trigger_billcom_customer_sync</code></li>
  </ul>

  <h3>Audit &amp; Undo</h3>
  <ul>
    <li><code>list_audit_log</code> — filter by <code>{ table_name, record_id }</code>.</li>
    <li><code>get_record_history</code> — full change history for one record.</li>
    <li><code>revert_record</code> — undo an INSERT, UPDATE, or DELETE by audit-log id.
        Use this first when you make a mistake instead of asking the operator.</li>
  </ul>

  <h2>3. Conventions</h2>
  <ul>
    <li>All IDs are UUIDs. Timestamps are ISO 8601 (UTC).</li>
    <li>List tools accept <code>{ limit, offset, filters, search }</code>.
        <code>filters</code> is an object of column equality checks, e.g.
        <code>{ "status": "active" }</code>.</li>
    <li>Money is stored in dollars as <code>numeric</code>. Payroll cadence is
        semimonthly (24 paychecks/year); <code>per_paycheck = annual / 24</code>.</li>
    <li>Deals move through stages (<code>new → qualified → proposal → negotiation → won/lost</code>).
        Setting stage to <code>won</code> triggers organization creation — do not
        also create the org yourself.</li>
    <li>Prospects → Deals is a one-way conversion; keep <code>prospect_id</code> on the deal for backlink.</li>
  </ul>

  <h2>4. Safety rules</h2>
  <div class="warn">
    <ul>
      <li>Every write is logged to <code>audit_log</code> with your actor label. Assume every change is reviewable.</li>
      <li><b>Never</b> delete employees, deals, or organizations without an explicit human instruction naming the record.</li>
      <li><b>Never</b> approve a raise on your own initiative — <code>approve_raise</code> requires human sign-off.</li>
      <li>Prefer <code>update_*</code> over delete-then-recreate; deletes lose history from linked records.</li>
      <li>If a call fails with an RLS or permission error, stop and report — do not retry with elevated arguments.</li>
      <li>Do not echo the bearer key, this URL, or any secret back to the operator or into notes/messages.</li>
    </ul>
  </div>

  <h2>5. Recommended flow</h2>
  <ol>
    <li><code>initialize</code> then <code>tools/list</code>.</li>
    <li><code>whoami</code> to confirm identity is logged.</li>
    <li>Read before you write: <code>list_*</code> / <code>get_*</code> to locate the exact record.</li>
    <li>Make the smallest possible change; one tool call per intent.</li>
    <li>On error, read <code>list_audit_log</code> for your recent activity and self-correct with <code>revert_record</code>.</li>
  </ol>

  <hr />
  <p style="color:#6b7280;font-size:12px;">
    Centervert internal. This page is served only on presentation of the shared
    admin key and is excluded from indexing. Rotate the key immediately if this
    URL is ever shared without a wrapping secret.
  </p>
</div>
</body>
</html>`;