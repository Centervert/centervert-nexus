// MCP server for Centervert portal.
// Implements MCP Streamable HTTP (JSON-RPC 2.0) directly — no SDK dependency.
// Auth: Bearer <MCP_ADMIN_KEY>. DB: service-role (bypasses RLS).

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MCP_ADMIN_KEY = (Deno.env.get("MCP_ADMIN_KEY") ?? "").trim();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-agent-id, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

const sb = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

// ─── Tool definitions ────────────────────────────────────────────────────────

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
}

const obj = (
  props: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> => ({
  type: "object",
  properties: props,
  required,
  additionalProperties: true,
});

const str = (description?: string) => ({ type: "string", description });
const num = (description?: string) => ({ type: "number", description });
const bool = (description?: string) => ({ type: "boolean", description });
const optStr = str;

// Generic list helper
async function listTable(
  table: string,
  input: Record<string, unknown>,
  defaultOrder = "created_at",
) {
  const limit = Math.min(Number(input.limit ?? 50), 500);
  const offset = Number(input.offset ?? 0);
  const filters = (input.filters as Record<string, unknown>) ?? {};
  let q = sb().from(table).select("*", { count: "exact" });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v as never);
  if (input.search && typeof input.search === "string") {
    // best-effort ilike on a "name" column if present
    q = q.ilike("name", `%${input.search}%`);
  }
  q = q.order(defaultOrder, { ascending: false }).range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: data, total: count, limit, offset };
}

async function getById(table: string, id: string) {
  const { data, error } = await sb().from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`${table} ${id} not found`);
  return data;
}

async function insertRow(table: string, values: Record<string, unknown>) {
  const { data, error } = await sb().from(table).insert(values).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateRow(table: string, id: string, values: Record<string, unknown>) {
  const { data, error } = await sb().from(table).update(values).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function deleteRow(table: string, id: string) {
  const { error } = await sb().from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { deleted: true, id };
}

const listInput = obj({
  limit: num("Max rows (default 50, max 500)"),
  offset: num("Pagination offset"),
  filters: { type: "object", description: "Column equality filters, e.g. { status: 'new' }" },
  search: optStr("Substring match on name column when supported"),
});

const idInput = obj({ id: str("UUID") }, ["id"]);

function buildTools(): ToolDef[] {
  const tools: ToolDef[] = [];

  // ─── Meta ───
  tools.push({
    name: "whoami",
    description: "Returns server info and available tool names.",
    inputSchema: obj({}),
    handler: async () => ({
      server: "centervert-mcp",
      version: "1.0.0",
      tool_count: tools.length,
      tools: tools.map((t) => t.name),
    }),
  });

  tools.push({
    name: "search",
    description: "Search across contacts, organizations, deals, projects by substring.",
    inputSchema: obj({ query: str("Search string"), limit: num() }, ["query"]),
    handler: async (i) => {
      const q = String(i.query);
      const limit = Math.min(Number(i.limit ?? 10), 50);
      const client = sb();
      const [contacts, orgs, deals, projects] = await Promise.all([
        client.from("contacts").select("id, first_name, last_name, email").or(
          `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`,
        ).limit(limit),
        client.from("organizations").select("id, name").ilike("name", `%${q}%`).limit(limit),
        client.from("deals").select("id, name").ilike("name", `%${q}%`).limit(limit),
        client.from("projects").select("id, name").ilike("name", `%${q}%`).limit(limit),
      ]);
      return {
        contacts: contacts.data ?? [],
        organizations: orgs.data ?? [],
        deals: deals.data ?? [],
        projects: projects.data ?? [],
      };
    },
  });

  // ─── CRM: Contacts ───
  tools.push(
    {
      name: "list_contacts",
      description: "List contacts.",
      inputSchema: listInput,
      handler: (i) => listTable("contacts", i),
    },
    {
      name: "get_contact",
      description: "Get a contact by id.",
      inputSchema: idInput,
      handler: (i) => getById("contacts", String(i.id)),
    },
    {
      name: "create_contact",
      description: "Create a contact.",
      inputSchema: obj({
        first_name: str(),
        last_name: str(),
        email: str(),
        phone: optStr(),
        title: optStr(),
        organization_id: optStr(),
        address: optStr(),
        notes: optStr(),
      }, ["first_name", "last_name", "email"]),
      handler: (i) => insertRow("contacts", i),
    },
    {
      name: "update_contact",
      description: "Update a contact by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("contacts", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "delete_contact",
      description: "Delete a contact by id.",
      inputSchema: idInput,
      handler: (i) => deleteRow("contacts", String(i.id)),
    },
  );

  // ─── CRM: Organizations ───
  tools.push(
    {
      name: "list_organizations",
      description: "List organizations.",
      inputSchema: listInput,
      handler: (i) => listTable("organizations", i),
    },
    {
      name: "get_organization",
      description: "Get organization by id.",
      inputSchema: idInput,
      handler: (i) => getById("organizations", String(i.id)),
    },
    {
      name: "create_organization",
      description: "Create an organization.",
      inputSchema: obj({
        name: str(),
        organization_type: optStr("private_company | government | non_profit"),
        website: optStr(),
        billing_email: optStr(),
        address: optStr(),
      }, ["name"]),
      handler: (i) => insertRow("organizations", i),
    },
    {
      name: "update_organization",
      description: "Update organization by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("organizations", String(i.id), i.patch as Record<string, unknown>),
    },
  );

  // ─── CRM: Deals (NEW opportunities) ───
  tools.push(
    {
      name: "list_deals",
      description: "List deals (Opportunities).",
      inputSchema: listInput,
      handler: (i) => listTable("deals", i),
    },
    {
      name: "get_deal",
      description: "Get deal by id.",
      inputSchema: idInput,
      handler: (i) => getById("deals", String(i.id)),
    },
    {
      name: "create_deal",
      description: "Create a deal.",
      inputSchema: obj({
        name: str(),
        description: optStr(),
        status: optStr(),
        priority: optStr(),
        organization_id: optStr(),
        contact_id: optStr(),
        estimated_value: num(),
        temperature: num(),
      }, ["name"]),
      handler: (i) => insertRow("deals", i),
    },
    {
      name: "update_deal",
      description: "Update a deal by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("deals", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "add_deal_message",
      description: "Post a message to a deal's chat.",
      inputSchema: obj({
        deal_id: str(),
        content: str(),
        created_by: optStr("User id, defaults to system if omitted"),
      }, ["deal_id", "content"]),
      handler: (i) =>
        insertRow("deal_messages", {
          deal_id: i.deal_id,
          content: i.content,
          created_by: i.created_by ?? null,
        }),
    },
  );

  // ─── Projects ───
  tools.push(
    {
      name: "list_projects",
      description: "List projects.",
      inputSchema: listInput,
      handler: (i) => listTable("projects", i),
    },
    {
      name: "get_project",
      description: "Get project by id.",
      inputSchema: idInput,
      handler: (i) => getById("projects", String(i.id)),
    },
    {
      name: "create_project",
      description: "Create a project.",
      inputSchema: obj({
        name: str(),
        description: optStr(),
        organization_id: optStr(),
        status: optStr(),
        project_type_id: optStr(),
      }, ["name"]),
      handler: (i) => insertRow("projects", i),
    },
    {
      name: "update_project",
      description: "Update project by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("projects", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "list_project_tasks",
      description: "List tasks. Pass filters: { project_id }.",
      inputSchema: listInput,
      handler: (i) => listTable("project_tasks", i),
    },
    {
      name: "create_project_task",
      description: "Create a task.",
      inputSchema: obj({
        project_id: str(),
        title: str(),
        description: optStr(),
        status: optStr(),
        sprint_id: optStr(),
        due_date: optStr(),
      }, ["project_id", "title"]),
      handler: (i) => insertRow("project_tasks", i),
    },
    {
      name: "update_project_task",
      description: "Update a task by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("project_tasks", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "assign_task",
      description: "Assign a user to a task.",
      inputSchema: obj({ task_id: str(), user_id: str() }, ["task_id", "user_id"]),
      handler: (i) =>
        insertRow("project_task_assignees", { task_id: i.task_id, user_id: i.user_id }),
    },
    {
      name: "list_sprints",
      description: "List sprints. Pass filters: { project_id }.",
      inputSchema: listInput,
      handler: (i) => listTable("project_sprints", i),
    },
    {
      name: "create_sprint",
      description: "Create a sprint.",
      inputSchema: obj({
        project_id: str(),
        name: str(),
        start_date: optStr(),
        end_date: optStr(),
      }, ["project_id", "name"]),
      handler: (i) => insertRow("project_sprints", i),
    },
    {
      name: "add_project_update",
      description: "Add a project update (activity feed entry).",
      inputSchema: obj({
        project_id: str(),
        content: str(),
        created_by: optStr(),
      }, ["project_id", "content"]),
      handler: (i) => insertRow("project_updates", i),
    },
    {
      name: "add_project_decision",
      description: "Add a project decision.",
      inputSchema: obj({ project_id: str(), title: str(), description: optStr() }, [
        "project_id",
        "title",
      ]),
      handler: (i) => insertRow("project_decisions", i),
    },
    {
      name: "add_project_risk",
      description: "Add a project risk.",
      inputSchema: obj({ project_id: str(), title: str(), description: optStr() }, [
        "project_id",
        "title",
      ]),
      handler: (i) => insertRow("project_risks", i),
    },
  );

  // ─── Back Office ───
  tools.push(
    {
      name: "list_employees",
      description: "List employees.",
      inputSchema: listInput,
      handler: (i) => listTable("employees", i),
    },
    {
      name: "get_employee",
      description: "Get employee by id.",
      inputSchema: idInput,
      handler: (i) => getById("employees", String(i.id)),
    },
    {
      name: "create_employee",
      description: "Create an employee.",
      inputSchema: obj({
        first_name: str(),
        last_name: str(),
        email: optStr(),
        position: optStr(),
        country: optStr(),
        employment_type: optStr(),
        is_active: bool(),
      }, ["first_name", "last_name"]),
      handler: (i) => insertRow("employees", i),
    },
    {
      name: "update_employee",
      description: "Update employee by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("employees", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "list_raises",
      description: "List employee raises. Pass filters: { employee_id, status }.",
      inputSchema: listInput,
      handler: (i) => listTable("employee_raises", i),
    },
    {
      name: "create_raise",
      description: "Create an employee raise.",
      inputSchema: obj({
        employee_id: str(),
        new_salary: num(),
        effective_date: str(),
        notes: optStr(),
      }, ["employee_id", "new_salary", "effective_date"]),
      handler: (i) => insertRow("employee_raises", i),
    },
    {
      name: "approve_raise",
      description: "Approve a raise.",
      inputSchema: idInput,
      handler: (i) => updateRow("employee_raises", String(i.id), { status: "approved" }),
    },
    {
      name: "update_raise",
      description: "Update an employee raise by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("employee_raises", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "delete_raise",
      description: "Delete an employee raise by id.",
      inputSchema: idInput,
      handler: (i) => deleteRow("employee_raises", String(i.id)),
    },
    {
      name: "delete_employee",
      description: "Delete an employee by id. Prefer setting is_active=false instead.",
      inputSchema: idInput,
      handler: (i) => deleteRow("employees", String(i.id)),
    },
    {
      name: "list_employee_compensation",
      description: "List effective compensation rows from the employee_compensation view (per_paycheck, per_month, annual, effective_amount, effective_salary_type, from_raise). Pass filters like { is_active: true } or { id: '<employee_id>' }.",
      inputSchema: listInput,
      handler: async (i) => {
        const limit = Math.min(Number(i.limit ?? 100), 500);
        const offset = Number(i.offset ?? 0);
        const filters = (i.filters as Record<string, unknown>) ?? {};
        let q = sb().from("employee_compensation").select("*", { count: "exact" });
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v as never);
        q = q.range(offset, offset + limit - 1);
        const { data, error, count } = await q;
        if (error) throw new Error(error.message);
        return { items: data, total: count, limit, offset };
      },
    },
    {
      name: "get_employee_compensation",
      description: "Get a single employee's effective compensation row from the employee_compensation view.",
      inputSchema: obj({ employee_id: str("Employee UUID") }, ["employee_id"]),
      handler: async (i) => {
        const { data, error } = await sb()
          .from("employee_compensation")
          .select("*")
          .eq("id", String(i.employee_id))
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error(`No compensation row for employee ${i.employee_id}`);
        return data;
      },
    },
    {
      name: "list_employee_notes",
      description: "List employee activity/notes. Pass filters: { employee_id, category }. Categories: general | payroll | bonus | performance | schedule.",
      inputSchema: listInput,
      handler: (i) => listTable("employee_notes", i),
    },
    {
      name: "add_employee_note",
      description: "Post an activity/comment on an employee's chat-style feed. Use categories: general, payroll, bonus, performance, schedule.",
      inputSchema: obj({
        employee_id: str(),
        content: str(),
        category: optStr("general | payroll | bonus | performance | schedule (default general)"),
        created_by: optStr("User id of author; omit for system/agent posts"),
      }, ["employee_id", "content"]),
      handler: (i) =>
        insertRow("employee_notes", {
          employee_id: i.employee_id,
          content: i.content,
          category: i.category ?? "general",
          created_by: i.created_by ?? null,
        }),
    },
    {
      name: "update_employee_note",
      description: "Edit an employee note by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("employee_notes", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "delete_employee_note",
      description: "Delete an employee note by id.",
      inputSchema: idInput,
      handler: (i) => deleteRow("employee_notes", String(i.id)),
    },
    {
      name: "list_employee_attachments",
      description: "List employee attachments (HR docs like W9, agreements). Pass filters: { employee_id }.",
      inputSchema: listInput,
      handler: (i) => listTable("employee_attachments", i),
    },
    {
      name: "delete_employee_attachment",
      description: "Delete an employee attachment record by id.",
      inputSchema: idInput,
      handler: (i) => deleteRow("employee_attachments", String(i.id)),
    },
    {
      name: "list_expenses",
      description: "List expenses.",
      inputSchema: listInput,
      handler: (i) => listTable("expenses", i),
    },
    {
      name: "create_expense",
      description: "Create an expense.",
      inputSchema: obj({
        description: str(),
        amount: num(),
        expense_date: str(),
        category: optStr(),
        payment_account: optStr(),
      }, ["description", "amount", "expense_date"]),
      handler: (i) => insertRow("expenses", i),
    },
    {
      name: "update_expense",
      description: "Update expense by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("expenses", String(i.id), i.patch as Record<string, unknown>),
    },
    {
      name: "list_income",
      description: "List income records.",
      inputSchema: listInput,
      handler: (i) => listTable("income", i),
    },
    {
      name: "create_income",
      description: "Create an income record.",
      inputSchema: obj({
        source: str(),
        amount: num(),
        income_date: str(),
        status: optStr("verified | projected"),
        organization_id: optStr(),
      }, ["source", "amount", "income_date"]),
      handler: (i) => insertRow("income", i),
    },
    {
      name: "update_income",
      description: "Update income by id.",
      inputSchema: obj({ id: str(), patch: { type: "object" } }, ["id", "patch"]),
      handler: (i) => updateRow("income", String(i.id), i.patch as Record<string, unknown>),
    },
  );

  // ─── Billing ───
  tools.push(
    {
      name: "list_audit_log",
      description: "List change-history entries. Filter with { table_name, record_id, actor_id, action } (action = INSERT|UPDATE|DELETE). Ordered newest-first.",
      inputSchema: obj({
        limit: num("Max rows (default 50, max 500)"),
        offset: num(),
        filters: { type: "object", description: "e.g. { table_name: 'employees', record_id: '<uuid>' }" },
      }),
      handler: async (i) => {
        const limit = Math.min(Number(i.limit ?? 50), 500);
        const offset = Number(i.offset ?? 0);
        const filters = (i.filters as Record<string, unknown>) ?? {};
        let q = sb().from("audit_log").select("*", { count: "exact" });
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v as never);
        q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        const { data, error, count } = await q;
        if (error) throw new Error(error.message);
        return { items: data, total: count, limit, offset };
      },
    },
    {
      name: "get_record_history",
      description: "Full change history for a single record (all inserts/updates/deletes with before/after snapshots and per-field diffs).",
      inputSchema: obj({
        table_name: str("e.g. 'employees', 'deals', 'contacts'"),
        record_id: str("UUID of the row"),
      }, ["table_name", "record_id"]),
      handler: async (i) => {
        const { data, error } = await sb()
          .from("audit_log")
          .select("*")
          .eq("table_name", String(i.table_name))
          .eq("record_id", String(i.record_id))
          .order("created_at", { ascending: true });
        if (error) throw new Error(error.message);
        return { history: data ?? [] };
      },
    },
    {
      name: "revert_record",
      description: "Revert a record to a prior state using a specific audit_log entry id. For UPDATE/DELETE entries it restores old_data; for INSERT entries it deletes the row (undoes the create). Returns the restored row or the deleted id.",
      inputSchema: obj({ audit_log_id: str("audit_log.id to revert to") }, ["audit_log_id"]),
      handler: async (i) => {
        const { data: entry, error: e1 } = await sb()
          .from("audit_log").select("*").eq("id", String(i.audit_log_id)).maybeSingle();
        if (e1) throw new Error(e1.message);
        if (!entry) throw new Error("audit_log entry not found");
        const table = entry.table_name as string;
        const recordId = entry.record_id as string;
        if (entry.action === "INSERT") {
          const { error } = await sb().from(table).delete().eq("id", recordId);
          if (error) throw new Error(error.message);
          return { reverted: true, action: "deleted_insert", table, id: recordId };
        }
        const old = entry.old_data as Record<string, unknown> | null;
        if (!old) throw new Error("No old_data on this entry to revert to");
        // Upsert old snapshot (covers both UPDATE-revert and DELETE-restore)
        const { data, error } = await sb().from(table).upsert(old).select().single();
        if (error) throw new Error(error.message);
        return { reverted: true, action: entry.action === "DELETE" ? "restored_delete" : "restored_update", table, row: data };
      },
    },
    {
      name: "list_invoices",
      description: "List invoices.",
      inputSchema: listInput,
      handler: (i) => listTable("invoices", i),
    },
    {
      name: "get_invoice",
      description: "Get invoice by id.",
      inputSchema: idInput,
      handler: (i) => getById("invoices", String(i.id)),
    },
    {
      name: "list_billcom_sync_logs",
      description: "List Bill.com sync activity log entries.",
      inputSchema: listInput,
      handler: (i) => listTable("billcom_sync_logs", i),
    },
    {
      name: "trigger_billcom_invoice_sync",
      description: "Invoke the sync-billcom-invoices edge function.",
      inputSchema: obj({}),
      handler: async () => {
        const { data, error } = await sb().functions.invoke("sync-billcom-invoices", {
          body: {},
        });
        if (error) throw new Error(error.message);
        return data;
      },
    },
    {
      name: "trigger_billcom_customer_sync",
      description: "Invoke the sync-billcom-customers edge function.",
      inputSchema: obj({}),
      handler: async () => {
        const { data, error } = await sb().functions.invoke("sync-billcom-customers", {
          body: {},
        });
        if (error) throw new Error(error.message);
        return data;
      },
    },
  );

  return tools;
}

const TOOLS = buildTools();
const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

// ─── Audit log ───────────────────────────────────────────────────────────────

async function audit(entry: {
  tool_name: string;
  input: unknown;
  success: boolean;
  output_summary?: string;
  error_message?: string;
  actor_label?: string | null;
}) {
  try {
    await sb().from("mcp_audit_log").insert({
      tool_name: entry.tool_name,
      input: entry.input as never,
      success: entry.success,
      output_summary: entry.output_summary?.slice(0, 500) ?? null,
      error_message: entry.error_message ?? null,
      actor_label: entry.actor_label ?? null,
    });
  } catch (_) {
    // Audit failure must not break tool call
  }
}

// ─── JSON-RPC handling ───────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function rpcError(id: unknown, code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}

async function handleRpc(req: JsonRpcRequest, actor: string | null): Promise<unknown | null> {
  const { method, params, id } = req;

  // Notifications (no id) → return null (no response)
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case "initialize":
        return rpcResult(id, {
          protocolVersion: "2025-06-18",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "centervert-mcp", version: "1.0.0" },
        });
      case "notifications/initialized":
      case "notifications/cancelled":
        return null;
      case "ping":
        return rpcResult(id, {});
      case "tools/list":
        return rpcResult(id, {
          tools: TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });
      case "tools/call": {
        const name = String(params?.name ?? "");
        const args = (params?.arguments as Record<string, unknown>) ?? {};
        const tool = TOOL_MAP.get(name);
        if (!tool) {
          await audit({
            tool_name: name,
            input: args,
            success: false,
            error_message: "Unknown tool",
            actor_label: actor,
          });
          return rpcError(id, -32601, `Unknown tool: ${name}`);
        }
        try {
          const out = await tool.handler(args);
          const text = JSON.stringify(out);
          await audit({
            tool_name: name,
            input: args,
            success: true,
            output_summary: text,
            actor_label: actor,
          });
          return rpcResult(id, {
            content: [{ type: "text", text }],
            isError: false,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await audit({
            tool_name: name,
            input: args,
            success: false,
            error_message: msg,
            actor_label: actor,
          });
          return rpcResult(id, {
            content: [{ type: "text", text: `Error: ${msg}` }],
            isError: true,
          });
        }
      }
      default:
        if (isNotification) return null;
        return rpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isNotification) return null;
    return rpcError(id, -32603, msg);
  }
}

// ─── HTTP entry point ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Health check
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, server: "centervert-mcp", tools: TOOLS.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("authorization") ?? "";
  const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!MCP_ADMIN_KEY) {
    return new Response(
      JSON.stringify(rpcError(null, -32002, "Server misconfigured: MCP_ADMIN_KEY not set")),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!provided || provided !== MCP_ADMIN_KEY) {
    return new Response(
      JSON.stringify(rpcError(null, -32001, "Unauthorized")),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const actor = req.headers.get("x-agent-id");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify(rpcError(null, -32700, "Parse error")),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Support batch
  if (Array.isArray(body)) {
    const out = await Promise.all(
      body.map((r) => handleRpc(r as JsonRpcRequest, actor)),
    );
    const filtered = out.filter((x) => x !== null);
    if (filtered.length === 0) return new Response(null, { status: 204, headers: corsHeaders });
    return new Response(JSON.stringify(filtered), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const result = await handleRpc(body as JsonRpcRequest, actor);
  if (result === null) return new Response(null, { status: 204, headers: corsHeaders });
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});