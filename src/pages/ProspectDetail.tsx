import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Phone, Globe, Plus, Pencil, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { VisitLogSheet } from "@/components/prospects/VisitLogSheet";
import { ProspectDialog } from "@/components/prospects/ProspectDialog";
import { ConvertProspectSheet } from "@/components/prospects/ConvertProspectSheet";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ActivityDialog } from "@/components/activities/ActivityDialog";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { TaskList } from "@/components/tasks/TaskList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROSPECT_STAGES, prospectStageLabel } from "@/lib/crm";
import { ProspectOverview } from "@/components/prospects/ProspectOverview";
import { ProspectPeople } from "@/components/prospects/ProspectPeople";
import { RecordHistory } from "@/components/history/RecordHistory";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  warm: "Warm",
  cold: "Cold",
  do_not_contact: "Do Not Contact",
  converted: "Converted",
};

const CONTACT_LABEL: Record<string, string> = {
  yes: "Spoke with someone",
  card_only: "Left card only",
  no: "No contact",
};

export default function ProspectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visitOpen, setVisitOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const { data: prospect, refetch } = useQuery({
    queryKey: ["prospect", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: visits, refetch: refetchVisits } = useQuery({
    queryKey: ["prospect-visits", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospect_visits")
        .select("*, profiles:rep_id(full_name, email)")
        .eq("prospect_id", id!)
        .order("visited_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: convertedDeal } = useQuery({
    queryKey: ["prospect-deal", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("deals")
        .select("id, name")
        .eq("prospect_id", id!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const toggleFollowUp = async (visitId: string, current: boolean) => {
    await supabase.from("prospect_visits").update({ follow_up_done: !current }).eq("id", visitId);
    refetchVisits();
  };

  const handleDelete = async () => {
    if (!prospect || !confirm("Delete this prospect and all its visits?")) return;
    const { error } = await supabase.from("prospects").delete().eq("id", prospect.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Prospect deleted" });
    navigate("/prospects");
  };

  if (!prospect) {
    return (
      <UnifiedLayout>
        <div className="p-6">Loading...</div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/prospects")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Prospects
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{prospect.name}</h1>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              {prospect.address && (
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {prospect.address}</div>
              )}
              {prospect.phone && (
                <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {prospect.phone}</div>
              )}
              {prospect.website && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <a href={prospect.website} target="_blank" rel="noreferrer" className="hover:underline">
                    {prospect.website}
                  </a>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Select
                value={(prospect as any).stage ?? "target"}
                onValueChange={async (v) => {
                  await supabase.from("prospects").update({ stage: v } as any).eq("id", prospect.id);
                  toast({ title: `Moved to ${prospectStageLabel(v)}` });
                  refetch();
                }}
              >
                <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROSPECT_STAGES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {prospect.category && <span className="text-sm text-muted-foreground">{prospect.category}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button onClick={() => setActivityOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Log Activity
            </Button>
            {(prospect as any).stage !== "converted" && (
              <Button variant="default" onClick={() => setConvertOpen(true)}>
                <ArrowRight className="h-4 w-4 mr-2" /> Convert to Opportunity
              </Button>
            )}
          </div>
        </div>

        {convertedDeal && (
          <div className="text-sm">
            <Link to={`/deals/${convertedDeal.id}`} className="text-primary hover:underline">
              → Became Deal: {convertedDeal.name}
            </Link>
          </div>
        )}

        {prospect.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{prospect.notes}</CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview">
              <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start">
                {[
                  { v: "overview", l: "Overview" },
                  { v: "people", l: "People" },
                  { v: "activities", l: "Activities" },
                  { v: "tasks", l: "Tasks" },
                  { v: "visits", l: `Visit history (${visits?.length ?? 0})` },
                  { v: "history", l: "History" },
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

              <TabsContent value="overview" className="pt-4">
                <ProspectOverview prospect={prospect} onSaved={refetch} />
              </TabsContent>

              <TabsContent value="people" className="pt-4">
                <ProspectPeople prospect={prospect} />
              </TabsContent>

              <TabsContent value="activities" className="pt-4">
                <ActivityTimeline filter={{ prospect_id: prospect.id }} />
              </TabsContent>

              <TabsContent value="tasks" className="pt-4">
                <TaskList links={{ prospect_id: prospect.id }} scope="all" />
              </TabsContent>

              <TabsContent value="visits" className="pt-4">
            {!visits || visits.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No visits yet. Log the first one above.
              </div>
            ) : (
              <div className="space-y-3">
                {visits.map((v: any) => (
                  <div key={v.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium">
                        {format(new Date(v.visited_at), "PPp")}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {v.profiles?.full_name ?? v.profiles?.email ?? "Unknown rep"}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Outcome:</span>{" "}
                      {CONTACT_LABEL[v.contact_made] ?? v.contact_made}
                      {v.person_spoken_to && <> — {v.person_spoken_to}</>}
                    </div>
                    {v.outcome_notes && (
                      <div className="text-sm whitespace-pre-wrap">{v.outcome_notes}</div>
                    )}
                    {v.follow_up_due && (
                      <button
                        onClick={() => toggleFollowUp(v.id, v.follow_up_done)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {v.follow_up_done ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                        Follow up by {format(new Date(v.follow_up_due), "PP")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
              </TabsContent>

              <TabsContent value="history" className="pt-4">
                <RecordHistory tableName="prospects" recordId={prospect.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-6 border-t">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete Prospect
          </Button>
        </div>
      </div>

      <ActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        links={{ prospect_id: prospect.id }}
        defaultType="in_person_visit"
        onSuccess={() => { refetch(); refetchVisits(); }}
      />
      <VisitLogSheet
        open={visitOpen}
        onOpenChange={setVisitOpen}
        prospectId={prospect.id}
        onSuccess={() => { refetch(); refetchVisits(); }}
      />
      <ProspectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        prospect={prospect}
        onSuccess={refetch}
      />
      <ConvertProspectSheet
        open={convertOpen}
        onOpenChange={setConvertOpen}
        prospect={prospect as any}
        suggestedContactName={visits?.find((v: any) => v.person_spoken_to)?.person_spoken_to ?? null}
        onConverted={() => refetch()}
      />
    </UnifiedLayout>
  );
}