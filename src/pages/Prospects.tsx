import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MapPin } from "lucide-react";
import { ProspectDialog } from "@/components/prospects/ProspectDialog";
import { ProspectKanban } from "@/components/prospects/ProspectKanban";
import { TaskList } from "@/components/tasks/TaskList";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  PROSPECT_STAGES,
  prospectStageColor,
  prospectStageLabel,
  type ProspectStage,
} from "@/lib/crm";

const STALE_DAYS = 14;

export default function Prospects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { data: prospects = [], refetch, isLoading } = useQuery({
    queryKey: ["prospects", search, stageFilter],
    queryFn: async () => {
      let q = supabase
        .from("prospects")
        .select("id, name, stage, category, address, last_activity_at, activity_count, organization_id, converted_deal_id")
        .order("updated_at", { ascending: false });
      if (stageFilter !== "all") q = q.eq("stage", stageFilter as any);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const changeStage = async (id: string, stage: ProspectStage) => {
    const { error } = await supabase.from("prospects").update({ stage } as any).eq("id", id);
    if (error) {
      toast.error("Could not move prospect");
      return;
    }
    toast.success(`Moved to ${prospectStageLabel(stage)}`);
    queryClient.invalidateQueries({ queryKey: ["prospects"] });
  };

  const staleCutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const unworked = prospects.filter((p) => !p.last_activity_at && p.stage !== "converted");
  const stale = prospects.filter(
    (p) =>
      p.last_activity_at &&
      new Date(p.last_activity_at).getTime() < staleCutoff &&
      p.stage !== "converted",
  );

  const renderTable = (rows: any[], empty: string) =>
    rows.length === 0 ? (
      <div className="text-center py-12 text-muted-foreground">{empty}</div>
    ) : (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Activities</TableHead>
              <TableHead>Last worked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/prospects/${p.id}`)}
              >
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <span className={prospectStageColor(p.stage)}>{prospectStageLabel(p.stage)}</span>
                </TableCell>
                <TableCell>{p.category ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  {p.address ? (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {p.address}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{p.activity_count ?? 0}</TableCell>
                <TableCell>
                  {p.last_activity_at ? (
                    formatDistanceToNow(new Date(p.last_activity_at), { addSuffix: true })
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <UnifiedLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prospecting</h1>
            <p className="text-muted-foreground">
              Everything before a real opportunity — targets, outreach and discovery.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Prospect
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {PROSPECT_STAGES.map((s) => (
            <Card key={s.value} className="p-3">
              <div className="text-xs text-muted-foreground truncate">{s.label}</div>
              <div className="text-xl font-semibold">
                {prospects.filter((p) => (p.stage || "target") === s.value).length}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {PROSPECT_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <Tabs defaultValue="board">
            <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start">
              {[
                { v: "board", l: "Board" },
                { v: "list", l: `List (${prospects.length})` },
                { v: "followups", l: "My Follow-Ups" },
                { v: "unworked", l: `Unworked (${unworked.length})` },
                { v: "stale", l: `Stale (${stale.length})` },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="board" className="pt-4">
              <ProspectKanban prospects={prospects} onStageChange={changeStage} />
            </TabsContent>

            <TabsContent value="list" className="pt-4">
              {renderTable(prospects, "No prospects yet. Add one to start prospecting.")}
            </TabsContent>

            <TabsContent value="followups" className="pt-4">
              <TaskList
                scope="mine"
                showLinks
                emptyMessage="No follow-ups assigned to you."
              />
            </TabsContent>

            <TabsContent value="unworked" className="pt-4">
              {renderTable(unworked, "Every prospect has been worked at least once.")}
            </TabsContent>

            <TabsContent value="stale" className="pt-4">
              {renderTable(stale, `Nothing has gone quiet for more than ${STALE_DAYS} days.`)}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ProspectDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={refetch} />
    </UnifiedLayout>
  );
}
