import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check } from "lucide-react";
import { stageLabel, type GateCheck } from "@/lib/meddpicc";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromStage: string;
  toStage: string;
  gates: GateCheck[];
  /** Called with the override reason (empty when all gates pass). */
  onConfirm: (overrideReason: string | null) => void;
}

export function StageChangeDialog({ open, onOpenChange, fromStage, toStage, gates, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const unmet = gates.filter((g) => !g.passed);

  const confirm = () => {
    if (unmet.length > 0 && !reason.trim()) return;
    onConfirm(unmet.length > 0 ? reason.trim() : null);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Move to {stageLabel(toStage)}
          </DialogTitle>
          <DialogDescription>
            From {stageLabel(fromStage)}. Gates are guidance, not locks — you can proceed with a reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {gates.map((g) => (
            <p key={g.label} className={`text-sm flex items-start gap-2 ${g.passed ? "text-muted-foreground" : "text-destructive"}`}>
              {g.passed ? (
                <Check className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              {g.label}
            </p>
          ))}
          {gates.length === 0 && <p className="text-sm text-muted-foreground">No gates for this stage.</p>}
        </div>

        {unmet.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="override">Override reason (required)</Label>
            <Textarea
              id="override"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why is this deal ready for ${stageLabel(toStage)} despite ${unmet.length} unmet gate${unmet.length > 1 ? "s" : ""}?`}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={unmet.length > 0 && !reason.trim()}>
            {unmet.length > 0 ? "Override and move" : "Move stage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}