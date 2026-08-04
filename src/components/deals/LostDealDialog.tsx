import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOSS_CATEGORIES } from "@/lib/crm";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (patch: Record<string, unknown>) => void;
}

export function LostDealDialog({ open, onOpenChange, onConfirm }: Props) {
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState("");
  const [winner, setWinner] = useState("");
  const [hadChampion, setHadChampion] = useState(false);
  const [ebConfirmed, setEbConfirmed] = useState(false);
  const [reengage, setReengage] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close as lost</DialogTitle>
          <DialogDescription>Capture why so the pipeline reporting stays honest.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Loss category</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {LOSS_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>What happened</Label>
            <Textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Who won it</Label>
            <Input value={winner} onChange={(e) => setWinner(e.target.value)} placeholder="Competitor or 'no decision'" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={hadChampion} onCheckedChange={(v) => setHadChampion(!!v)} />
            We had a real champion
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={ebConfirmed} onCheckedChange={(v) => setEbConfirmed(!!v)} />
            The economic buyer was confirmed
          </label>
          <div className="space-y-1.5">
            <Label>Re-engage on</Label>
            <Input type="date" value={reengage} onChange={(e) => setReengage(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!category}
            onClick={() =>
              onConfirm({
                loss_category: category,
                loss_detail: detail || null,
                lost_reason: detail || LOSS_CATEGORIES.find((c) => c.value === category)?.label || category,
                actual_winner: winner || null,
                had_champion: hadChampion,
                economic_buyer_confirmed: ebConfirmed,
                reengage_on: reengage || null,
              })
            }
          >
            Mark as lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}