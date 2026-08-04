export const RELATIONSHIP_STATUSES = [
  { value: "target_account", label: "Target Account" },
  { value: "prospect_account", label: "Prospect Account" },
  { value: "active_opportunity", label: "Active Opportunity" },
  { value: "customer", label: "Customer" },
  { value: "former_customer", label: "Former Customer" },
  { value: "partner", label: "Partner" },
  { value: "vendor", label: "Vendor" },
  { value: "inactive", label: "Inactive" },
  { value: "do_not_contact", label: "Do Not Contact" },
] as const;

export const relationshipLabel = (v?: string | null) =>
  RELATIONSHIP_STATUSES.find((s) => s.value === v)?.label ?? "Target Account";

export const PROSPECT_STAGES = [
  { value: "target", label: "Target", hint: "Identified, not yet worked." },
  { value: "prospect", label: "Prospect", hint: "Worth an attempt." },
  { value: "contacted", label: "Contacted", hint: "At least one outbound attempt made." },
  { value: "connected", label: "Connected", hint: "A real two-way conversation happened." },
  { value: "discovery_scheduled", label: "Discovery Scheduled", hint: "A discovery meeting is on the calendar." },
  { value: "converted", label: "Converted", hint: "Became an opportunity." },
] as const;

export type ProspectStage = (typeof PROSPECT_STAGES)[number]["value"];

export const prospectStageLabel = (v?: string | null) =>
  PROSPECT_STAGES.find((s) => s.value === v)?.label ?? v ?? "—";

export const prospectStageColor = (v?: string | null) => {
  switch (v) {
    case "target": return "text-muted-foreground";
    case "prospect": return "text-blue-600";
    case "contacted": return "text-amber-600";
    case "connected": return "text-orange-600";
    case "discovery_scheduled": return "text-emerald-600";
    case "converted": return "text-primary";
    default: return "text-muted-foreground";
  }
};

export const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "in_person_visit", label: "In-person visit" },
  { value: "card_drop_off", label: "Card drop-off" },
  { value: "walk_in", label: "Walk-in" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "text", label: "Text message" },
  { value: "voicemail", label: "Voicemail" },
  { value: "demo", label: "Demo" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "contract_sent", label: "Contract sent" },
  { value: "note", label: "Note" },
] as const;

export const activityLabel = (v?: string | null) =>
  ACTIVITY_TYPES.find((a) => a.value === v)?.label ?? v ?? "Activity";

export const INTEREST_LEVELS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

export const TASK_TYPES = [
  { value: "follow_up", label: "Follow-up" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Schedule meeting" },
  { value: "proposal", label: "Proposal" },
  { value: "contract", label: "Contract" },
  { value: "research", label: "Research" },
  { value: "internal", label: "Internal" },
];

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

export const TASK_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export const PRICING_MODELS = [
  { value: "fixed", label: "Fixed price" },
  { value: "time_and_materials", label: "Time & materials" },
  { value: "retainer", label: "Monthly retainer" },
  { value: "subscription", label: "Subscription" },
  { value: "hybrid", label: "Hybrid" },
];

export const APPROVAL_STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "approved", label: "Approved" },
  { value: "not_required", label: "Not required" },
  { value: "blocked", label: "Blocked" },
];

export const LOSS_CATEGORIES = [
  { value: "price", label: "Price" },
  { value: "no_decision", label: "No decision / status quo" },
  { value: "competitor", label: "Lost to competitor" },
  { value: "timing", label: "Timing" },
  { value: "no_budget", label: "No budget" },
  { value: "poor_fit", label: "Poor fit" },
  { value: "lost_champion", label: "Lost the champion" },
  { value: "internal_build", label: "Built internally" },
  { value: "unresponsive", label: "Went unresponsive" },
  { value: "other", label: "Other" },
];
