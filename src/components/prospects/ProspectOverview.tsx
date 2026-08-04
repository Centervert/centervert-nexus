import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INTEREST_LEVELS, prospectStageLabel } from "@/lib/crm";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface Props {
  prospect: any;
  onSaved: () => void;
}

const CHECKLIST = [
  { field: "has_possible_problem", label: "There is a possible problem worth solving" },
  { field: "spoke_with_relevant_person", label: "Spoke with a relevant person" },
  { field: "discovery_scheduled", label: "Discovery meeting scheduled" },
];

export function ProspectOverview({ prospect, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    source: prospect.source ?? "",
    campaign: prospect.campaign ?? "",
    interest_level: prospect.interest_level ?? "",
    next_action: prospect.next_action ?? "",
    next_action_due_on: prospect.next_action_due_on ?? "",
  });

  const patch = async (values: Record<string, unknown>) => {
    const { error } = await supabase.from("prospects").update(values as any).eq("id", prospect.id);
    if (error) {
      toast.error("Could not save");
      return;
    }
    onSaved();
  };

  const daysInStage = prospect.stage_changed_at
    ? Math.max(0, Math.floor((Date.now() - new Date(prospect.stage_changed_at).getTime()) / 86400000))
    : null;

  const readyToConvert =
    prospect.has_possible_problem && prospect.spoke_with_relevant_person && prospect.discovery_scheduled;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Stage" value={prospectStageLabel(prospect.stage)} />
          <Row label="Days in stage" value={daysInStage === null ? "—" : `${daysInStage}`} />
          <Row
            label="Last activity"
            value={
              prospect.last_activity_at
                ? formatDistanceToNow(new Date(prospect.last_activity_at), { addSuffix: true })
                : "Never"
            }
          />
          <Row label="Activities logged" value={String(prospect.activity_count ?? 0)} />
          <Row
            label="Next action due"
            value={prospect.next_action_due_on ? format(new Date(prospect.next_action_due_on), "PP") : "—"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Qualification checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {CHECKLIST.map((c) => (
            <label key={c.field} className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={!!prospect[c.field]}
                onCheckedChange={(v) => patch({ [c.field]: !!v })}
              />
              <span>{c.label}</span>
            </label>
          ))}
          <p className={`text-xs pt-1 ${readyToConvert ? "text-emerald-600" : "text-muted-foreground"}`}>
            {readyToConvert
              ? "Ready to convert to an opportunity."
              : "Complete the checklist before converting."}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-3"><CardTitle className="text-base">Source & next action</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Input
              value={form.source}
              placeholder="Canvassing, referral, inbound..."
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Campaign</Label>
            <Input
              value={form.campaign}
              onChange={(e) => setForm({ ...form, campaign: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Interest level</Label>
            <Select
              value={form.interest_level || undefined}
              onValueChange={(v) => setForm({ ...form, interest_level: v })}
            >
              <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
              <SelectContent>
                {INTEREST_LEVELS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Next action due</Label>
            <Input
              type="date"
              value={form.next_action_due_on ?? ""}
              onChange={(e) => setForm({ ...form, next_action_due_on: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Next action</Label>
            <Input
              value={form.next_action}
              placeholder="Call back and ask for the owner"
              onChange={(e) => setForm({ ...form, next_action: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button
              size="sm"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await patch({
                  source: form.source || null,
                  campaign: form.campaign || null,
                  interest_level: form.interest_level || null,
                  next_action: form.next_action || null,
                  next_action_due_on: form.next_action_due_on || null,
                });
                setSaving(false);
                toast.success("Saved");
              }}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}