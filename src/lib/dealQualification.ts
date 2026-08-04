import { supabase } from "@/integrations/supabase/client";
import type { DealFacts, ElementRow } from "@/lib/meddpicc";

/**
 * Loads the MEDDPICC element rows plus the structured-record facts that feed
 * gate checks and critical-gap rules. Shared by the deal page and the board so
 * both evaluate stage moves identically.
 */
export async function fetchDealQualification(
  dealId: string,
  stage: string,
  profile: string | null | undefined,
  compellingEvent?: string | null,
): Promise<{ elements: ElementRow[]; facts: DealFacts }> {
  const [els, pains, actions, criteria, stakeholders, competitors] = await Promise.all([
    supabase.from("deal_elements").select("element, score, summary, last_verified_at").eq("deal_id", dealId),
    supabase.from("deal_pains").select("buyer_owned").eq("deal_id", dealId),
    supabase.from("deal_next_actions").select("owner_side, status").eq("deal_id", dealId),
    supabase.from("deal_criteria").select("must_have, resolved").eq("deal_id", dealId),
    supabase.from("deal_stakeholders").select("role, stance").eq("deal_id", dealId),
    supabase.from("deal_competitors").select("id").eq("deal_id", dealId),
  ]);

  const elements = (els.data || []) as ElementRow[];
  const facts: DealFacts = {
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

  return { elements, facts };
}
