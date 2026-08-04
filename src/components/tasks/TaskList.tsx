import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format, isBefore, parseISO, startOfToday } from "date-fns";
import { Link } from "react-router-dom";
import { TaskDialog, type TaskLinks } from "./TaskDialog";

interface Props {
  links?: TaskLinks;
  scope?: "all" | "open" | "overdue" | "mine";
  showLinks?: boolean;
  showAddButton?: boolean;
  emptyMessage?: string;
}

export function TaskList({ links, scope = "open", showLinks = false, showAddButton = true, emptyMessage = "No tasks yet." }: Props) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["tasks", links, scope],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      let q = supabase
        .from("tasks")
        .select("*, prospects(id, name), deals(id, name), organizations(id, name)")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(200);
      if (links?.organization_id) q = q.eq("organization_id", links.organization_id);
      if (links?.contact_id) q = q.eq("contact_id", links.contact_id);
      if (links?.prospect_id) q = q.eq("prospect_id", links.prospect_id);
      if (links?.deal_id) q = q.eq("deal_id", links.deal_id);
      if (scope === "open" || scope === "overdue") q = q.in("status", ["open", "in_progress"]);
      if (scope === "overdue") q = q.lt("due_date", new Date().toISOString().slice(0, 10));
      if (scope === "mine" && userData.user?.id) {
        q = q.eq("owner_id", userData.user.id).in("status", ["open", "in_progress"]);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async (task: any) => {
      const done = task.status === "done";
      const { error } = await supabase
        .from("tasks")
        .update({
          status: done ? "open" : "done",
          completed_at: done ? null : new Date().toISOString(),
        })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return (
    <div className="space-y-3">
      {showAddButton && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add task
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="divide-y border rounded-lg">
          {rows.map((t: any) => {
            const overdue = t.due_date && t.status !== "done" && isBefore(parseISO(t.due_date), startOfToday());
            return (
              <div key={t.id} className="flex items-start gap-3 p-3">
                <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle.mutate(t)} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <button
                    className={`text-sm text-left ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}
                    onClick={() => { setEditing(t); setDialogOpen(true); }}
                  >
                    {t.title}
                  </button>
                  <div className="text-xs text-muted-foreground space-x-3 mt-0.5">
                    <span>{t.owner_side === "customer" ? "Customer-owned" : "Ours"}</span>
                    {t.owner_name && <span>{t.owner_name}</span>}
                    {t.due_date && (
                      <span className={overdue ? "text-destructive" : ""}>
                        Due {format(parseISO(t.due_date), "MMM d, yyyy")}
                      </span>
                    )}
                    {t.priority === "high" && <span className="text-amber-600">High priority</span>}
                  </div>
                  {showLinks && (
                    <div className="text-xs mt-1 space-x-3">
                      {t.prospects && <Link className="text-primary hover:underline" to={`/prospects/${t.prospects.id}`}>{t.prospects.name}</Link>}
                      {t.deals && <Link className="text-primary hover:underline" to={`/deals/${t.deals.id}`}>{t.deals.name}</Link>}
                      {t.organizations && <Link className="text-primary hover:underline" to={`/organizations/${t.organizations.id}`}>{t.organizations.name}</Link>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} links={links} task={editing} />
    </div>
  );
}
