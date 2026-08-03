import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Info } from "lucide-react";
import { ElementCard, type EvidenceItem } from "./ElementCard";
import { elementsForProfile, scoreMap, type ElementRow, type Gap } from "@/lib/meddpicc";

interface Props {
  dealId: string;
  profile: string | null | undefined;
  elements: ElementRow[];
  gaps: Gap[];
  onChanged: () => void;
}

export function QualificationTab({ dealId, profile, elements, gaps, onChanged }: Props) {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const defs = elementsForProfile(profile);
  const scores = scoreMap(elements);
  const summaries: Record<string, ElementRow | undefined> = {};
  for (const e of elements) summaries[e.element] = e;

  const loadEvidence = async () => {
    const { data } = await supabase
      .from("deal_evidence")
      .select("id, element, note, source, occurred_on, confirmed_by")
      .eq("deal_id", dealId)
      .order("occurred_on", { ascending: false });
    setEvidence((data || []) as EvidenceItem[]);
  };

  useEffect(() => {
    loadEvidence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const upsertElement = async (element: string, patch: Record<string, unknown>) => {
    const { data: userData } = await supabase.auth.getUser();
    const existing = summaries[element];
    const payload = {
      deal_id: dealId,
      element,
      score: existing?.score ?? 0,
      summary: existing?.summary ?? null,
      last_verified_at: new Date().toISOString(),
      updated_by: userData.user?.id ?? null,
      ...patch,
    };
    const { error } = await supabase
      .from("deal_elements")
      .upsert(payload, { onConflict: "deal_id,element" });
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    onChanged();
  };

  const addEvidence = async (element: string, note: string, source: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("deal_evidence").insert({
      deal_id: dealId,
      element,
      note,
      source: source || null,
      created_by: userData.user?.id ?? null,
    });
    if (error) {
      toast({ title: "Could not add evidence", description: error.message, variant: "destructive" });
      return;
    }
    await loadEvidence();
    await upsertElement(element, {});
  };

  return (
    <div className="space-y-4">
      {gaps.length > 0 && (
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Gaps to close ({gaps.filter((g) => g.severity === "critical").length} critical)
          </p>
          {gaps.map((g) => (
            <p
              key={g.id}
              className={`text-xs flex items-start gap-2 ${g.severity === "critical" ? "text-destructive" : "text-muted-foreground"}`}
            >
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              {g.message}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {defs.map((def) => (
          <ElementCard
            key={def.key}
            def={def}
            profile={profile}
            score={scores[def.key] ?? 0}
            summary={summaries[def.key]?.summary ?? null}
            lastVerifiedAt={summaries[def.key]?.last_verified_at ?? null}
            evidence={evidence.filter((e) => e.element === def.key)}
            onScoreChange={(score) => upsertElement(def.key, { score })}
            onSummaryChange={(summary) => upsertElement(def.key, { summary })}
            onAddEvidence={(note, source) => addEvidence(def.key, note, source)}
          />
        ))}
      </div>
    </div>
  );
}