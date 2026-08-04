import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_TYPES, INTEREST_LEVELS } from "@/lib/crm";

export interface ActivityLinks {
  organization_id?: string | null;
  contact_id?: string | null;
  prospect_id?: string | null;
  deal_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links?: ActivityLinks;
  defaultType?: string;
  onSuccess?: () => void;
}

const toLocalInput = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function ActivityDialog({ open, onOpenChange, links, defaultType = "call", onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState(defaultType);
  const [occurredAt, setOccurredAt] = useState(toLocalInput(new Date()));
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [personSpokenTo, setPersonSpokenTo] = useState("");
  const [outcome, setOutcome] = useState("");
  const [interest, setInterest] = useState("");
  const [leftBehind, setLeftBehind] = useState("");
  const [followUp, setFollowUp] = useState("");

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setOccurredAt(toLocalInput(new Date()));
      setSubject("");
      setBody("");
      setPersonSpokenTo("");
      setOutcome("");
      setInterest("");
      setLeftBehind("");
      setFollowUp("");
    }
  }, [open, defaultType]);

  const isFieldVisit = type === "card_drop_off" || type === "in_person_visit" || type === "walk_in";

  const save = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const { error } = await supabase.from("activities").insert({
        activity_type: type,
        subject: subject || null,
        body: body || null,
        occurred_at: new Date(occurredAt).toISOString(),
        person_spoken_to: personSpokenTo || null,
        outcome: outcome || null,
        interest_level: interest || null,
        left_behind: leftBehind || null,
        follow_up_on: followUp || null,
        owner_id: uid,
        created_by: uid,
        organization_id: links?.organization_id ?? null,
        contact_id: links?.contact_id ?? null,
        prospect_id: links?.prospect_id ?? null,
        deal_id: links?.deal_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Activity logged" });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["prospect"] });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e: Error) =>
      toast({ title: "Could not log activity", description: e.message, variant: "destructive" }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log activity</SheetTitle>
          <SheetDescription>Every interaction lives on one timeline.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occurred">When</Label>
              <Input id="occurred" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Notes</Label>
            <Textarea id="body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="spoke">Spoke with</Label>
              <Input id="spoke" value={personSpokenTo} onChange={(e) => setPersonSpokenTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Interest level</Label>
              <Select value={interest} onValueChange={setInterest}>
                <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
                <SelectContent>
                  {INTEREST_LEVELS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="outcome">Outcome</Label>
            <Input id="outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What happened?" />
          </div>

          {isFieldVisit && (
            <div className="space-y-1.5">
              <Label htmlFor="left">What was left behind</Label>
              <Input id="left" value={leftBehind} onChange={(e) => setLeftBehind(e.target.value)} placeholder="Business card, one-pager…" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="followup">Follow-up date</Label>
            <Input id="followup" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Log activity</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
