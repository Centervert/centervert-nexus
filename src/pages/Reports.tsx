import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { prospectStageLabel } from "@/lib/crm";
import { stageLabel, isTerminalStage } from "@/lib/meddpicc";

const money = (v: any) => `$${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const days = (v: any) => (v == null ? "—" : `${Number(v).toFixed(0)}d`);

export default function Reports() {
  const { data: prospectStages = [] } = useQuery({
    queryKey: ["report-prospect-stages"],
    queryFn: async () => (await supabase.from("prospect_stage_counts").select("*")).data ?? [],
  });

  const { data: conversion = [] } = useQuery({
    queryKey: ["report-conversion"],
    queryFn: async () => (await supabase.from("prospect_conversion").select("*")).data ?? [],
  });

  const { data: pipeline = [] } = useQuery({
    queryKey: ["report-pipeline"],
    queryFn: async () => (await supabase.from("opportunity_pipeline").select("*")).data ?? [],
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["report-activity"],
    queryFn: async () =>
      (await supabase.from("activity_volume").select("*").order("week", { ascending: false }).limit(60)).data ?? [],
  });

  const { data: lostDeals = [] } = useQuery({
    queryKey: ["report-lost"],
    queryFn: async () =>
      (await supabase.from("deals").select("id, loss_category, lost_reason, expected_value").eq("stage", "lost")).data ?? [],
  });

  const wonCount = pipeline.find((p: any) => p.stage === "won")?.deal_count ?? 0;
  const lostCount = pipeline.find((p: any) => p.stage === "lost")?.deal_count ?? 0;
  const winRate = Number(wonCount) + Number(lostCount) > 0
    ? ((Number(wonCount) / (Number(wonCount) + Number(lostCount))) * 100).toFixed(0)
    : "—";

  const lossByCategory = lostDeals.reduce((acc: Record<string, number>, d: any) => {
    const key = d.loss_category ?? d.lost_reason ?? "Unspecified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const activityTotals = activity.reduce((acc: Record<string, number>, a: any) => {
    acc[a.activity_type] = (acc[a.activity_type] ?? 0) + Number(a.activity_count);
    return acc;
  }, {});

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Pipeline health across prospecting, opportunities and activity.</p>
        </div>

        <Tabs defaultValue="prospecting">
          <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start">
            {[
              { v: "prospecting", l: "Prospecting" },
              { v: "opportunity", l: "Opportunity" },
              { v: "meddpicc", l: "MEDDPICC" },
              { v: "activity", l: "Activity" },
              { v: "forecast", l: "Forecast" },
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

          <TabsContent value="prospecting" className="pt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Prospects by stage</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Prospects</TableHead>
                      <TableHead>Stale (14d+)</TableHead>
                      <TableHead>Avg. days in stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospectStages.map((r: any) => (
                      <TableRow key={r.stage}>
                        <TableCell>{prospectStageLabel(r.stage)}</TableCell>
                        <TableCell>{r.prospect_count}</TableCell>
                        <TableCell>{r.stale_count}</TableCell>
                        <TableCell>{days(r.avg_days_in_stage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Conversion by owner</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Prospects</TableHead>
                      <TableHead>Discovery scheduled</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversion.map((r: any, i: number) => (
                      <TableRow key={r.owner_id ?? i}>
                        <TableCell className="font-mono text-xs">{r.owner_id ? r.owner_id.slice(0, 8) : "Unassigned"}</TableCell>
                        <TableCell>{r.total_prospects}</TableCell>
                        <TableCell>{r.discovery_scheduled}</TableCell>
                        <TableCell>{r.converted_prospects}</TableCell>
                        <TableCell>
                          {Number(r.total_prospects) > 0
                            ? `${((Number(r.converted_prospects) / Number(r.total_prospects)) * 100).toFixed(0)}%`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunity" className="pt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Pipeline by stage</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Avg. score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipeline.map((r: any) => (
                      <TableRow key={r.stage}>
                        <TableCell>{stageLabel(r.stage)}</TableCell>
                        <TableCell>{r.deal_count}</TableCell>
                        <TableCell>{money(r.pipeline_value)}</TableCell>
                        <TableCell>{r.avg_score ? Number(r.avg_score).toFixed(1) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-sm text-muted-foreground mt-4">Win rate: {winRate}{winRate === "—" ? "" : "%"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Loss reasons</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(lossByCategory).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No losses recorded.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Reason</TableHead><TableHead>Deals</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(lossByCategory).map(([k, v]) => (
                        <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v as number}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meddpicc" className="pt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Gap exposure by stage</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead>Avg. score</TableHead>
                      <TableHead>Critical gaps</TableHead>
                      <TableHead>Value at risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipeline.filter((r: any) => !isTerminalStage(r.stage)).map((r: any) => (
                      <TableRow key={r.stage}>
                        <TableCell>{stageLabel(r.stage)}</TableCell>
                        <TableCell>{r.deal_count}</TableCell>
                        <TableCell>{r.avg_score ? Number(r.avg_score).toFixed(1) : "—"}</TableCell>
                        <TableCell className={Number(r.total_gaps) > 0 ? "text-destructive" : ""}>{r.total_gaps ?? 0}</TableCell>
                        <TableCell>{Number(r.total_gaps) > 0 ? money(r.pipeline_value) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="pt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Activity volume</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(activityTotals).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity logged yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Type</TableHead><TableHead>Logged</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(activityTotals)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .map(([k, v]) => (
                          <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v as number}</TableCell></TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="pt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Forecast by stage</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Stage</TableHead><TableHead>Deals</TableHead><TableHead>Value</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipeline.filter((r: any) => !isTerminalStage(r.stage)).map((r: any) => (
                      <TableRow key={r.stage}>
                        <TableCell>{stageLabel(r.stage)}</TableCell>
                        <TableCell>{r.deal_count}</TableCell>
                        <TableCell>{money(r.pipeline_value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedLayout>
  );
}
