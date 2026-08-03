import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    const [els, pains, actions, criteria, stakeholders, competitors] = await Promise.all([
      supabase.from("deal_elements").select("element, score, summary, last_verified_at").eq("deal_id", dealId),
      supabase.from("deal_pains").select("buyer_owned").eq("deal_id", dealId),
      supabase.from("deal_next_actions").select("owner_side, status").eq("deal_id", dealId),
      supabase.from("deal_criteria").select("must_have, resolved").eq("deal_id", dealId),
      supabase.from("deal_stakeholders").select("role, stance").eq("deal_id", dealId),
      supabase.from("deal_competitors").select("id").eq("deal_id", dealId),
    ]);

    const rows = (els.data || []) as ElementRow[];
    setElements(rows);

    const nextFacts: DealFacts = {
      stage,
      methodology_profile: profile,
      compelling_event: compellingEvent || null,
      hasBuyerOwnedPain: (pains.data || []).some((p: any) => p.buyer_owned),
      hasCustomerOwnedNextStep: (actions.data || []).some(
        (a: any) => a.owner_side === "customer" && a.status === "open",
      ),
      hasUnresolvedMustHave: (criteria.data || []).some((c: any) => c.must_have && !c.resolved),
      hasActiveChampion: (stakeholders.data || []).some(
        (s: any) => s.role === "champion" && s.stance !== "opposed",
      ),
      hasCompetitors: (competitors.data || []).length > 0,
    };
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