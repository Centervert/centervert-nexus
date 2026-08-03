import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, AlertTriangle } from "lucide-react";
import {
  EVIDENCE_SCALE,
  displayElement,
  isStale,
  scoreTone,
  type ElementDef,
} from "@/lib/meddpicc";

export interface EvidenceItem {
  id: string;
  element: string | null;
  note: string;
  source: string | null;
  occurred_on: string;
  confirmed_by: string | null;
}

interface Props {
  def: ElementDef;
  profile: string | null | undefined;
  score: number;
  summary: string | null;
  lastVerifiedAt: string | null;
  evidence: EvidenceItem[];
  onScoreChange: (score: number) => void;
  onSummaryChange: (summary: string) => void;
  onAddEvidence: (note: string, source: string) => void;
}

export function ElementCard({
  def,
  profile,
  score,
  summary,
  lastVerifiedAt,
  evidence,
  onScoreChange,
  onSummaryChange,
  onAddEvidence,
}: Props) {
  const d = displayElement(def, profile);
  const [draft, setDraft] = useState(summary ?? "");
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState("");
  const [source, setSource] = useState("");
  const stale = isStale(lastVerifiedAt, score);

  useEffect(() => {
    setDraft(summary ?? "");
  }, [summary]);

  const submitEvidence = () => {
    if (!note.trim()) return;
    onAddEvidence(note.trim(), source.trim());
    setNote("");
    setSource("");
    setAdding(false);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{def.letter}</span>
              <h3 className="font-semibold text-sm truncate">{d.label}</h3>
              {stale && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" /> Stale
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{d.question}</p>
          </div>
          <TooltipProvider delayDuration={150}>
            <div className="flex gap-1 shrink-0">
              {EVIDENCE_SCALE.map((s) => (
                <Tooltip key={s.score}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onScoreChange(s.score)}
                      className={`h-7 w-7 rounded text-xs font-semibold transition-all ${
                        score === s.score ? scoreTone(s.score) + " ring-2 ring-ring" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                      }`}
                    >
                      {s.score}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== (summary ?? "") && onSummaryChange(draft)}
          placeholder="What do we know, and what proves it?"
          rows={2}
          className="text-sm"
        />

        <div className="space-y-1.5">
          {evidence.map((e) => (
            <div key={e.id} className="text-xs border-l-2 border-border pl-2">
              <span className="text-muted-foreground">{e.occurred_on}</span> — {e.note}
              {e.source && <span className="text-muted-foreground"> ({e.source})</span>}
            </div>
          ))}
          {adding ? (
            <div className="space-y-1.5 pt-1">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Evidence — what was said, shown or signed"
                className="h-8 text-xs"
              />
              <div className="flex gap-1.5">
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Source (call, email, doc)"
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8" onClick={submitEvidence}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAdding(true)}>
              <Plus className="h-3 w-3 mr-1" /> Evidence
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Score 4: {def.score4}
          {lastVerifiedAt && ` · Verified ${new Date(lastVerifiedAt).toLocaleDateString()}`}
        </p>
      </CardContent>
    </Card>
  );
}