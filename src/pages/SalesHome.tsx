import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, Plus, MapPin, Building2, Users, Target, CalendarClock } from "lucide-react";
import { ActivityDialog } from "@/components/activities/ActivityDialog";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskList } from "@/components/tasks/TaskList";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { prospectStageLabel, PROSPECT_STAGES } from "@/lib/crm";
import { stageLabel, isTerminalStage } from "@/lib/meddpicc";

export default function SalesHome() {
  const navigate = useNavigate();
  const [activityOpen, setActivityOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [cardDropOpen, setCardDropOpen] = useState(false);

  const { data: prospectCounts = [] } = useQuery({
    queryKey: ["prospect-stage-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prospect_stage_counts").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pipeline = [] } = useQuery({
    queryKey: ["opportunity-pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunity_pipeline").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: riskDeals = [] } = useQuery({
    queryKey: ["risk-deals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("deals")
        .select("id, name, stage, qualification_score, critical_gap_count, next_action")
        .gt("critical_gap_count", 0)
        .order("critical_gap_count", { ascending: false })
        .limit(6);
      return (data ?? []).filter((d) => !isTerminalStage(d.stage));
    },
  });

  const openPipeline = pipeline.filter((p: any) => !isTerminalStage(p.stage));
  const totalPipeline = openPipeline.reduce((s: number, p: any) => s + Number(p.pipeline_value ?? 0), 0);
  const totalDeals = openPipeline.reduce((s: number, p: any) => s + Number(p.deal_count ?? 0), 0);
  const staleProspects = prospectCounts.reduce((s: number, p: any) => s + Number(p.stale_count ?? 0), 0);

  const quickActions = [
    { label: "Log activity", icon: Plus, onClick: () => setActivityOpen(true) },
    { label: "Record card drop-off", icon: MapPin, onClick: () => setCardDropOpen(true) },
    { label: "Schedule follow-up", icon: CalendarClock, onClick: () => setTaskOpen(true) },
    { label: "Add prospect", icon: Target, onClick: () => navigate("/prospects") },
    { label: "Create company", icon: Building2, onClick: () => navigate("/organizations") },
    { label: "Add person", icon: Users, onClick: () => navigate("/contacts") },
  ];

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Sales Home</h1>
          <p className="text-muted-foreground">Your daily command center for prospecting and opportunities.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Button key={a.label} variant="outline" size="sm" onClick={a.onClick}>
              <a.icon className="h-4 w-4 mr-1.5" />
              {a.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">My Work Today</CardTitle></CardHeader>
            <CardContent>
              <TaskList scope="mine" showLinks showAddButton={false} emptyMessage="No open tasks assigned to you." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Prospecting Snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PROSPECT_STAGES.map((s) => {
                const row: any = prospectCounts.find((p: any) => p.stage === s.value);
                return (
                  <div key={s.value} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium">{row?.prospect_count ?? 0}</span>
                  </div>
                );
              })}
              {staleProspects > 0 && (
                <p className="text-xs text-amber-600 pt-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  {staleProspects} prospect{staleProspects === 1 ? "" : "s"} with no activity in 14 days
                </p>
              )}
              <Button variant="ghost" size="sm" className="px-0" onClick={() => navigate("/prospects")}>
                Open Prospecting →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Opportunity Snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Open opportunities</span>
                <span className="font-medium">{totalDeals}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pipeline value</span>
                <span className="font-medium">${totalPipeline.toLocaleString()}</span>
              </div>
              {openPipeline.map((p: any) => (
                <div key={p.stage} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{stageLabel(p.stage)}</span>
                  <span>{p.deal_count}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="px-0" onClick={() => navigate("/deals")}>
                Open Opportunities →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">MEDDPICC Risk Panel</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {riskDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical gaps on open opportunities.</p>
              ) : (
                riskDeals.map((d: any) => (
                  <div key={d.id} className="space-y-0.5">
                    <Link to={`/deals/${d.id}`} className="text-sm font-medium text-primary hover:underline">
                      {d.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {stageLabel(d.stage)} • score {d.qualification_score} •{" "}
                      <span className="text-destructive">{d.critical_gap_count} critical gap{d.critical_gap_count === 1 ? "" : "s"}</span>
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <ActivityTimeline showLinks limit={8} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ActivityDialog open={activityOpen} onOpenChange={setActivityOpen} />
      <ActivityDialog open={cardDropOpen} onOpenChange={setCardDropOpen} defaultType="card_drop_off" />
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
    </UnifiedLayout>
  );
}
