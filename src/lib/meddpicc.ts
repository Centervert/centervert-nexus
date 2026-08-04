/**
 * MEDDPICC sales operating system — single source of truth for stages,
 * elements, evidence scoring, stage gates and critical-gap rules.
 */

export const DEAL_STAGES = [
  { value: "discovery", label: "Discovery", meaning: "Do they have a real problem?" },
  { value: "qualified", label: "Qualified Opportunity", meaning: "Is this worth pursuing?" },
  { value: "solution_fit", label: "Solution Fit", meaning: "Can we actually solve it?" },
  { value: "preferred_vendor", label: "Preferred Vendor", meaning: "Will they choose us?" },
  { value: "commercial", label: "Negotiation & Contracts", meaning: "Can we agree on price, legal and paperwork?" },
  { value: "commit", label: "Ready to Sign", meaning: "Is this deal genuinely about to close?" },
  { value: "on_hold", label: "On Hold", meaning: "Paused" },
  { value: "won", label: "Won", meaning: "Signed and sold" },
  { value: "lost", label: "Lost", meaning: "It did not close; capture why" },
] as const;

export type DealStage = (typeof DEAL_STAGES)[number]["value"];

/** Ordered forward pipeline (excludes on_hold / terminal states). */
export const PIPELINE_ORDER: DealStage[] = [
  "discovery",
  "qualified",
  "solution_fit",
  "preferred_vendor",
  "commercial",
  "commit",
];

export function stageLabel(stage: string): string {
  return DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function isTerminalStage(stage: string) {
  return stage === "won" || stage === "lost";
}

/* ------------------------------------------------------------------ */
/* Elements & profiles                                                 */
/* ------------------------------------------------------------------ */

export type ElementKey =
  | "metrics"
  | "economic_buyer"
  | "decision_criteria"
  | "decision_process"
  | "paper_process"
  | "pain"
  | "champion"
  | "competition";

export interface ElementDef {
  key: ElementKey;
  letter: string;
  label: string;
  question: string;
  score4: string;
}

export const ELEMENTS: ElementDef[] = [
  {
    key: "metrics",
    letter: "M",
    label: "Metrics",
    question: "What measurable business value will this create?",
    score4: "Validated business case and measurement plan",
  },
  {
    key: "economic_buyer",
    letter: "E",
    label: "Economic Buyer",
    question: "Who has the ultimate economic authority?",
    score4: "Directly engaged and economically aligned",
  },
  {
    key: "decision_criteria",
    letter: "D",
    label: "Decision Criteria",
    question: "What standards will be used to evaluate solutions?",
    score4: "Complete, weighted and validated",
  },
  {
    key: "decision_process",
    letter: "D",
    label: "Decision Process",
    question: "How will the organization reach a decision?",
    score4: "Confirmed, dated, owned and progressing",
  },
  {
    key: "paper_process",
    letter: "P",
    label: "Paper Process",
    question: "What legal, security and procurement steps lead to signature?",
    score4: "Fully mapped and actively underway",
  },
  {
    key: "pain",
    letter: "I",
    label: "Pain",
    question: "What serious business problem requires action?",
    score4: "Executive-level, consequential and urgent",
  },
  {
    key: "champion",
    letter: "C",
    label: "Champion",
    question: "Who will sell and drive the solution internally?",
    score4: "Tested internal seller taking action",
  },
  {
    key: "competition",
    letter: "C",
    label: "Competition",
    question: "What vendors, alternatives or status quo compete with us?",
    score4: "Full landscape and validated win strategy",
  },
];

export type MethodologyProfile = "full" | "standard" | "lite";

export const PROFILES: { value: MethodologyProfile; label: string; description: string }[] = [
  {
    value: "full",
    label: "MEDDPICC Full",
    description: "Custom software, AI, ERP, integration-heavy deals — all 8 elements",
  },
  {
    value: "standard",
    label: "MEDDIC Standard",
    description: "Mid-complexity deals — 6 core elements",
  },
  {
    value: "lite",
    label: "Lite",
    description: "Small packaged offerings — problem, outcome, decision maker, timing",
  },
];

const PROFILE_ELEMENTS: Record<MethodologyProfile, ElementKey[]> = {
  full: ELEMENTS.map((e) => e.key),
  standard: ["metrics", "economic_buyer", "decision_criteria", "decision_process", "pain", "champion"],
  lite: ["pain", "metrics", "economic_buyer", "decision_process"],
};

export function elementsForProfile(profile: string | null | undefined): ElementDef[] {
  const keys = PROFILE_ELEMENTS[(profile as MethodologyProfile) || "full"] ?? PROFILE_ELEMENTS.full;
  return ELEMENTS.filter((e) => keys.includes(e.key));
}

/** Lite profile shows plain-English prompts instead of the acronym. */
export const LITE_PROMPTS: Partial<Record<ElementKey, { label: string; question: string }>> = {
  pain: { label: "Problem", question: "What does the customer need fixed?" },
  metrics: { label: "Outcome", question: "What result do they want?" },
  economic_buyer: { label: "Decision maker", question: "Who can approve the purchase?" },
  decision_process: { label: "Buying process", question: "What must happen before purchase?" },
};

export function displayElement(def: ElementDef, profile: string | null | undefined) {
  if (profile === "lite" && LITE_PROMPTS[def.key]) {
    return { ...def, ...LITE_PROMPTS[def.key]! };
  }
  return def;
}

/* ------------------------------------------------------------------ */
/* Evidence scale                                                      */
/* ------------------------------------------------------------------ */

export const EVIDENCE_SCALE = [
  { score: 0, label: "Unknown", description: "No information" },
  { score: 1, label: "Hypothesis", description: "Seller hypothesis" },
  { score: 2, label: "Acknowledged", description: "Buyer acknowledged" },
  { score: 3, label: "Validated", description: "Buyer validated with specific details" },
  { score: 4, label: "Demonstrated", description: "Executive alignment, artifact or action" },
] as const;

export function scoreLabel(score: number) {
  return EVIDENCE_SCALE.find((s) => s.score === score)?.label ?? "Unknown";
}

/** Tailwind classes for a score chip — semantic tokens only. */
export function scoreTone(score: number) {
  if (score >= 4) return "bg-primary text-primary-foreground";
  if (score === 3) return "bg-primary/60 text-primary-foreground";
  if (score === 2) return "bg-primary/30 text-foreground";
  if (score === 1) return "bg-muted-foreground/25 text-foreground";
  return "bg-muted text-muted-foreground";
}

/** Days after which evidence is considered stale. */
export const STALE_AFTER_DAYS = 30;

export function isStale(lastVerifiedAt: string | null | undefined, score: number) {
  if (score === 0) return false;
  if (!lastVerifiedAt) return true;
  const days = (Date.now() - new Date(lastVerifiedAt).getTime()) / 86_400_000;
  return days > STALE_AFTER_DAYS;
}

/* ------------------------------------------------------------------ */
/* Qualification state                                                 */
/* ------------------------------------------------------------------ */

export interface ElementRow {
  element: string;
  score: number;
  summary: string | null;
  last_verified_at: string | null;
}

export interface DealFacts {
  stage: string;
  methodology_profile?: string | null;
  compelling_event?: string | null;
  hasBuyerOwnedPain?: boolean;
  hasCustomerOwnedNextStep?: boolean;
  hasUnresolvedMustHave?: boolean;
  hasActiveChampion?: boolean;
  hasCompetitors?: boolean;
}

export function scoreMap(rows: ElementRow[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const e of ELEMENTS) m[e.key] = 0;
  for (const r of rows) m[r.element] = r.score ?? 0;
  return m;
}

export function totalScore(rows: ElementRow[], profile?: string | null) {
  const keys = elementsForProfile(profile).map((e) => e.key);
  const m = scoreMap(rows);
  return keys.reduce((sum, k) => sum + (m[k] || 0), 0);
}

export function maxScore(profile?: string | null) {
  return elementsForProfile(profile).length * 4;
}

export interface Gap {
  id: string;
  message: string;
  severity: "critical" | "warning";
}

const LATE_STAGES: string[] = ["preferred_vendor", "commercial", "commit"];

export function criticalGaps(rows: ElementRow[], facts: DealFacts): Gap[] {
  const s = scoreMap(rows);
  const gaps: Gap[] = [];
  const late = LATE_STAGES.includes(facts.stage);

  if (!facts.hasBuyerOwnedPain && s.pain < 3)
    gaps.push({ id: "pain", message: "No buyer-owned pain — the deal is not fully qualified", severity: "critical" });
  if (late && s.economic_buyer < 2)
    gaps.push({ id: "economic_buyer", message: "Economic Buyer unknown in a late stage", severity: "critical" });
  if (!facts.hasActiveChampion && s.champion < 3)
    gaps.push({ id: "champion", message: "No active champion", severity: "critical" });
  if (s.decision_process < 3)
    gaps.push({ id: "decision_process", message: "Decision Process unvalidated — close date is unreliable", severity: "warning" });
  if ((facts.stage === "commercial" || facts.stage === "commit") && s.paper_process < 2)
    gaps.push({ id: "paper_process", message: "Paper Process unknown during the commercial stage", severity: "critical" });
  if (!facts.hasCustomerOwnedNextStep)
    gaps.push({ id: "next_step", message: "No customer-owned next step — the deal is stalled", severity: "warning" });
  if (!facts.compelling_event)
    gaps.push({ id: "compelling_event", message: "No compelling event or cost of delay — urgency risk", severity: "warning" });
  if (facts.hasUnresolvedMustHave)
    gaps.push({ id: "must_have", message: "An unresolved must-have decision criterion — high loss risk", severity: "critical" });
  if (!facts.hasCompetitors && s.competition < 2)
    gaps.push({ id: "competition", message: "Competition unknown — reduce forecast confidence", severity: "warning" });

  return gaps;
}

/* ------------------------------------------------------------------ */
/* Stage gates                                                         */
/* ------------------------------------------------------------------ */

export interface GateCheck {
  label: string;
  passed: boolean;
}

export function stageGates(target: string, rows: ElementRow[], facts: DealFacts): GateCheck[] {
  const s = scoreMap(rows);
  switch (target) {
    case "discovery":
      return [];
    case "qualified":
      return [
        { label: "Pain score at least 2", passed: s.pain >= 2 },
        { label: "Preliminary metric hypothesis", passed: s.metrics >= 1 },
        { label: "Customer-owned next step", passed: !!facts.hasCustomerOwnedNextStep },
      ];
    case "solution_fit":
      return [
        { label: "Pain validated (3+)", passed: s.pain >= 3 },
        { label: "Metrics acknowledged by the buyer (2+)", passed: s.metrics >= 2 },
        { label: "Decision criteria captured (2+)", passed: s.decision_criteria >= 2 },
        { label: "Champion identified (2+)", passed: s.champion >= 2 },
      ];
    case "preferred_vendor":
      return [
        { label: "Decision criteria at least 3", passed: s.decision_criteria >= 3 },
        { label: "Decision process at least 3", passed: s.decision_process >= 3 },
        { label: "Champion at least 3", passed: s.champion >= 3 },
        { label: "Economic buyer engaged (3+)", passed: s.economic_buyer >= 3 },
        { label: "Competition strategy established (2+)", passed: s.competition >= 2 },
        { label: "No unresolved must-have criterion", passed: !facts.hasUnresolvedMustHave },
      ];
    case "commercial":
      return [
        { label: "Paper process mapped (2+)", passed: s.paper_process >= 2 },
        { label: "Economic buyer engaged (3+)", passed: s.economic_buyer >= 3 },
        { label: "Metrics validated (3+)", passed: s.metrics >= 3 },
        { label: "Customer-owned next step", passed: !!facts.hasCustomerOwnedNextStep },
      ];
    case "commit":
      return [
        { label: "Economic buyer approval (4)", passed: s.economic_buyer >= 4 },
        { label: "Active champion (3+)", passed: s.champion >= 3 },
        { label: "Decision process complete (4)", passed: s.decision_process >= 4 },
        { label: "Paper process at least 3", passed: s.paper_process >= 3 },
        { label: "No unresolved must-have criterion", passed: !facts.hasUnresolvedMustHave },
        { label: "Buyer-owned next action scheduled", passed: !!facts.hasCustomerOwnedNextStep },
        { label: "Compelling event recorded", passed: !!facts.compelling_event },
      ];
    default:
      return [];
  }
}

export function unmetGates(target: string, rows: ElementRow[], facts: DealFacts) {
  return stageGates(target, rows, facts).filter((g) => !g.passed);
}

/* ------------------------------------------------------------------ */
/* Forecast                                                            */
/* ------------------------------------------------------------------ */

export const FORECAST_CATEGORIES = [
  { value: "pipeline", label: "Pipeline" },
  { value: "best_case", label: "Best Case" },
  { value: "commit", label: "Commit" },
  { value: "closed", label: "Closed" },
] as const;

/** Forecast category implied by the pipeline stage. */
export function forecastForStage(stage: string): string {
  switch (stage) {
    case "won":
    case "lost":
      return "closed";
    case "commit":
      return "commit";
    case "preferred_vendor":
    case "commercial":
      return "best_case";
    default:
      return "pipeline";
  }
}

/** Score as a 0-100 percentage of the profile maximum. */
export function scorePercent(score: number, profile?: string | null) {
  const max = maxScore(profile);
  return max > 0 ? Math.round((score / max) * 100) : 0;
}