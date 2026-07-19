import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MailOpen, MessageCircle, DoorClosed } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "card_only", label: "Card drop", hint: "Left a card, no contact", icon: MailOpen },
  { value: "yes", label: "Made contact", hint: "Spoke with someone", icon: MessageCircle },
  { value: "no", label: "No one there", hint: "Nobody available", icon: DoorClosed },
] as const;

interface VisitLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectId: string;
  onSuccess?: () => void;
}

export function VisitLogSheet({ open, onOpenChange, prospectId, onSuccess }: VisitLogSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [contactMade, setContactMade] = useState<string>("card_only");
  const [personSpokenTo, setPersonSpokenTo] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [followUpDue, setFollowUpDue] = useState<Date | undefined>();

  useEffect(() => {
    if (open) {
      setContactMade("card_only");
      setPersonSpokenTo("");
      setOutcomeNotes("");
      setFollowUpDue(undefined);
    }
  }, [open]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("prospect_visits").insert({
      prospect_id: prospectId,
      rep_id: user.id,
      created_by: user.id,
      contact_made: contactMade as any,
      person_spoken_to: personSpokenTo || null,
      outcome_notes: outcomeNotes || null,
      follow_up_due: followUpDue ? format(followUpDue, "yyyy-MM-dd") : null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Visit logged" });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Visit</SheetTitle>
          <SheetDescription>Record this drop-off and set a follow-up if needed.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Contact Made</Label>
            <Select value={contactMade} onValueChange={setContactMade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes — spoke with someone</SelectItem>
                <SelectItem value="card_only">Left card only</SelectItem>
                <SelectItem value="no">No contact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Person Spoken To</Label>
            <Input
              value={personSpokenTo}
              onChange={(e) => setPersonSpokenTo(e.target.value)}
              placeholder="Manager, owner, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Outcome / Notes</Label>
            <Textarea
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              rows={4}
              placeholder="What happened, next steps..."
            />
          </div>

          <div className="space-y-2">
            <Label>Follow-up Due</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !followUpDue && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {followUpDue ? format(followUpDue, "PPP") : "Pick a date (optional)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={followUpDue}
                  onSelect={setFollowUpDue}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Log Visit"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}