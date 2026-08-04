import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDealQualification } from "@/lib/dealQualification";
import {
  criticalGaps,
  totalScore,
  maxScore,
  type DealFacts,
  type ElementRow,
  type Gap,
} from "@/lib/meddpicc";

export interface QualificationState {
  elements: ElementRow[];
  facts: DealFacts;
  gaps: Gap[];
  score: number;
  max: number;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Loads the MEDDPICC element scores plus the structured-record facts that feed
 * the critical-gap rules, and keeps the rollup columns on `deals` in sync.
 */
export function useDealQualification(
  dealId: string | undefined,
  stage: string,
  profile: string | null | undefined,
  compellingEvent: string | null | undefined,
): QualificationState {
  const [elements, setElements] = useState<ElementRow[]>([]);
  const [facts, setFacts] = useState<DealFacts>({ stage, methodology_profile: profile });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    const { elements: rows, facts: nextFacts } = await fetchDealQualification(
      dealId,
      stage,
      profile,
      compellingEvent,
    );
    setElements(rows);
    setFacts(nextFacts);

    const score = totalScore(rows, profile);
    const gapCount = criticalGaps(rows, nextFacts).filter((g) => g.severity === "critical").length;
    await supabase
      .from("deals")
      .update({ qualification_score: score, critical_gap_count: gapCount })
      .eq("id", dealId);

    setLoading(false);
  }, [dealId, stage, profile, compellingEvent]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    elements,
    facts,
    gaps: criticalGaps(elements, facts),
    score: totalScore(elements, profile),
    max: maxScore(profile),
    loading,
    reload,
  };
}