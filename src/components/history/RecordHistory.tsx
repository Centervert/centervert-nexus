import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Clock, Plus, Pencil, Trash2, RotateCcw, User, Bot } from "lucide-react";

interface Props {
  tableName: string;
  recordId: string;
}

type Entry = {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  actor_source: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 120 ? v.slice(0, 120) + "…" : v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function RecordHistory({ tableName, recordId }: Props) {
  const { data: role } = useUserRole();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["record-history", tableName, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log" as any)
        .select("*")
        .eq("table_name", tableName)
        .eq("record_id", recordId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Entry[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["history-actors", data?.map((e) => e.actor_id).filter(Boolean)],
    enabled: !!data?.length,
    queryFn: async () => {
      const ids = Array.from(new Set((data ?? []).map((e) => e.actor_id).filter(Boolean))) as string[];
      if (!ids.length) return {} as Record<string, string>;
      const { data: p } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, string> = {};
      (p ?? []).forEach((r: any) => (map[r.id] = r.full_name || r.email || r.id));
      return map;
    },
  });

  const revert = useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase.functions.invoke("mcp", {
        body: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "revert_record", arguments: { audit_log_id: entryId } },
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Reverted");
      qc.invalidateQueries({ queryKey: ["record-history", tableName, recordId] });
    },
    onError: (e: Error) => toast.error(e.message || "Revert failed"),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading history…</div>;
  if (!data?.length) {
    return (
      <div className="text-sm text-muted-foreground p-6 text-center border rounded-lg">
        No changes recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((e) => {
        const actor =
          e.actor_id && profiles?.[e.actor_id]
            ? profiles[e.actor_id]
            : e.actor_source === "agent"
            ? "AI Agent / System"
            : "Unknown";
        const Icon = e.action === "INSERT" ? Plus : e.action === "DELETE" ? Trash2 : Pencil;
        const color =
          e.action === "INSERT"
            ? "text-green-600"
            : e.action === "DELETE"
            ? "text-red-600"
            : "text-blue-600";
        return (
          <div key={e.id} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="font-medium">{e.action}</span>
                <span className="text-muted-foreground">by</span>
                <span className="flex items-center gap-1">
                  {e.actor_source === "agent" ? (
                    <Bot className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {actor}
                </span>
                <Badge variant="outline" className="text-xs">
                  {e.actor_source}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </span>
                {role?.isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 gap-1">
                        <RotateCcw className="h-3 w-3" />
                        Revert
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revert this change?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {e.action === "INSERT"
                            ? "This will DELETE the record (undo the create)."
                            : e.action === "DELETE"
                            ? "This will RESTORE the deleted record with its prior values."
                            : "This will roll the record back to its state before this edit."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revert.mutate(e.id)}>
                          Revert
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {e.action === "UPDATE" && e.changed_fields && (
              <div className="mt-2 space-y-1 text-xs">
                {Object.entries(e.changed_fields).map(([field, diff]) => (
                  <div key={field} className="grid grid-cols-[140px_1fr] gap-2 items-start">
                    <span className="font-medium text-muted-foreground">{field}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-through text-red-600/80 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                        {fmt(diff.old)}
                      </span>
                      <span>→</span>
                      <span className="text-green-700 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">
                        {fmt(diff.new)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {e.action === "INSERT" && e.new_data && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-muted-foreground">View created values</summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-[11px]">
                  {JSON.stringify(e.new_data, null, 2)}
                </pre>
              </details>
            )}

            {e.action === "DELETE" && e.old_data && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-muted-foreground">View deleted values</summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-[11px]">
                  {JSON.stringify(e.old_data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}