import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { RecordHistory } from "@/components/history/RecordHistory";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Bot, User, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const TABLES = [
  "contacts", "organizations", "deals", "deal_messages",
  "projects", "project_tasks", "project_updates",
  "employees", "employee_raises", "employee_notes",
  "expenses", "income", "invoices",
  "prospects", "prospect_visits", "user_roles", "profiles",
];

export default function History() {
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ table: string; id: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log-all", tableFilter, actionFilter],
    queryFn: async () => {
      let q = supabase.from("audit_log" as any).select("*").order("created_at", { ascending: false }).limit(200);
      if (tableFilter !== "all") q = q.eq("table_name", tableFilter);
      if (actionFilter !== "all") q = q.eq("action", actionFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const filtered = (data ?? []).filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.table_name?.toLowerCase().includes(s) ||
      e.record_id?.toLowerCase().includes(s) ||
      JSON.stringify(e.changed_fields ?? {}).toLowerCase().includes(s)
    );
  });

  return (
    <UnifiedLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Change History</h1>
          <p className="text-sm text-muted-foreground">
            Every create, edit, and delete across the system. Admins can revert.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {TABLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Edited</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search table, id, or field…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {selected && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <span className="text-muted-foreground">History for</span>{" "}
                <span className="font-mono">{selected.table}</span>{" "}
                <span className="font-mono text-xs">{selected.id}</span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-muted-foreground hover:underline"
              >
                Close
              </button>
            </div>
            <RecordHistory tableName={selected.table} recordId={selected.id} />
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="border rounded-lg divide-y">
            {filtered.map((e) => {
              const Icon = e.action === "INSERT" ? Plus : e.action === "DELETE" ? Trash2 : Pencil;
              const color =
                e.action === "INSERT" ? "text-green-600"
                : e.action === "DELETE" ? "text-red-600"
                : "text-blue-600";
              return (
                <button
                  key={e.id}
                  onClick={() => setSelected({ table: e.table_name, id: e.record_id })}
                  className="w-full text-left p-3 hover:bg-muted/50 flex items-center gap-3 text-sm"
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="font-medium w-20">{e.action}</span>
                  <span className="font-mono text-xs w-40 truncate">{e.table_name}</span>
                  <span className="font-mono text-xs text-muted-foreground w-72 truncate">
                    {e.record_id}
                  </span>
                  <Badge variant="outline" className="gap-1">
                    {e.actor_source === "agent" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {e.actor_source}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No history entries.</div>
            )}
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}