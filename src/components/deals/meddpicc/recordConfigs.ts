import type { FieldDef } from "./RecordList";

export interface RecordConfig {
  table: string;
  title: string;
  description: string;
  primaryField: string;
  metaFields: string[];
  fields: FieldDef[];
}

const yesNo = (label: string): FieldDef => ({ name: "", label, type: "checkbox" });
void yesNo;

export const STAKEHOLDERS: RecordConfig = {
  table: "deal_stakeholders",
  title: "Stakeholders",
  description: "Role, authority, influence and stance — title alone never proves authority.",
  primaryField: "name",
  metaFields: ["title", "role", "authority", "influence", "stance", "last_engaged_on"],
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "title", label: "Title", type: "text" },
    {
      name: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "economic_buyer", label: "Economic Buyer" },
        { value: "champion", label: "Champion" },
        { value: "influencer", label: "Influencer" },
        { value: "technical_buyer", label: "Technical Buyer" },
        { value: "user_buyer", label: "User Buyer" },
        { value: "coach", label: "Coach" },
        { value: "blocker", label: "Blocker" },
      ],
    },
    {
      name: "authority",
      label: "Authority",
      type: "select",
      options: [
        { value: "unknown", label: "Unknown" },
        { value: "recommends", label: "Recommends" },
        { value: "approves", label: "Approves" },
        { value: "final", label: "Final sign-off" },
      ],
    },
    {
      name: "influence",
      label: "Influence",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
    {
      name: "stance",
      label: "Stance",
      type: "select",
      options: [
        { value: "supporter", label: "Supporter" },
        { value: "neutral", label: "Neutral" },
        { value: "skeptical", label: "Skeptical" },
        { value: "opposed", label: "Opposed" },
      ],
    },
    {
      name: "relationship_strength",
      label: "Relationship strength",
      type: "select",
      options: [
        { value: "unknown", label: "Unknown" },
        { value: "weak", label: "Weak" },
        { value: "developing", label: "Developing" },
        { value: "strong", label: "Strong" },
      ],
    },
    { name: "last_engaged_on", label: "Last engaged", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
};

export const METRICS: RecordConfig = {
  table: "deal_metrics",
  title: "Metrics",
  description: "Baseline, target, timeframe and owner — not generic efficiency claims.",
  primaryField: "name",
  metaFields: ["baseline", "target", "timeframe", "owner_name", "validated"],
  fields: [
    { name: "name", label: "Metric", type: "text", required: true, placeholder: "Hours lost to manual invoicing" },
    { name: "baseline", label: "Baseline", type: "text" },
    { name: "target", label: "Target", type: "text" },
    { name: "unit", label: "Unit", type: "text" },
    { name: "timeframe", label: "Timeframe", type: "text" },
    { name: "owner_name", label: "Customer owner", type: "text" },
    { name: "validated", label: "Validated by the buyer", type: "checkbox" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
};

export const PAINS: RecordConfig = {
  table: "deal_pains",
  title: "Pains",
  description: "Problem, impact and consequence — pain must be buyer-owned.",
  primaryField: "description",
  metaFields: ["level", "impact", "owner_name", "buyer_owned"],
  fields: [
    { name: "description", label: "Pain", type: "text", required: true },
    {
      name: "level",
      label: "Level",
      type: "select",
      options: [
        { value: "operational", label: "Operational" },
        { value: "financial", label: "Financial" },
        { value: "strategic", label: "Strategic" },
        { value: "executive", label: "Executive" },
      ],
    },
    { name: "impact", label: "Impact", type: "textarea" },
    { name: "consequence", label: "Consequence of inaction", type: "textarea" },
    { name: "owner_name", label: "Owner", type: "text" },
    { name: "buyer_owned", label: "Buyer owns this pain", type: "checkbox" },
  ],
};

export const CRITERIA: RecordConfig = {
  table: "deal_criteria",
  title: "Decision Criteria",
  description: "Each criterion weighted, with our position and whether it is a must-have.",
  primaryField: "criterion",
  metaFields: ["category", "weight", "must_have", "our_position", "resolved"],
  fields: [
    { name: "criterion", label: "Criterion", type: "text", required: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "technical", label: "Technical" },
        { value: "economic", label: "Economic" },
        { value: "relationship", label: "Relationship" },
      ],
    },
    { name: "weight", label: "Weight (1-5)", type: "number" },
    { name: "must_have", label: "Must-have", type: "checkbox" },
    {
      name: "our_position",
      label: "Our position",
      type: "select",
      options: [
        { value: "unknown", label: "Unknown" },
        { value: "behind", label: "Behind" },
        { value: "parity", label: "Parity" },
        { value: "ahead", label: "Ahead" },
      ],
    },
    { name: "resolved", label: "Resolved", type: "checkbox" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
};

export const PROCESS_STEPS: RecordConfig = {
  table: "deal_process_steps",
  title: "Process Steps",
  description: "Decision and paper-process milestones — dated, owned and buyer-confirmed.",
  primaryField: "name",
  metaFields: ["category", "owner_name", "due_date", "status", "confirmed_by_buyer"],
  orderByPlaceholder: undefined as never,
  fields: [
    { name: "name", label: "Step", type: "text", required: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "decision", label: "Decision process" },
        { value: "paper", label: "Paper process" },
        { value: "implementation", label: "Implementation" },
      ],
    },
    { name: "sequence", label: "Order", type: "number" },
    { name: "owner_name", label: "Owner", type: "text" },
    { name: "due_date", label: "Due date", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "not_started", label: "Not started" },
        { value: "in_progress", label: "In progress" },
        { value: "complete", label: "Complete" },
        { value: "blocked", label: "Blocked" },
      ],
    },
    { name: "confirmed_by_buyer", label: "Confirmed by the buyer", type: "checkbox" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
} as RecordConfig;

export const COMPETITORS: RecordConfig = {
  table: "deal_competitors",
  title: "Competition",
  description: "Vendors, incumbents, internal build, status quo and doing nothing.",
  primaryField: "name",
  metaFields: ["competitor_type", "position"],
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "competitor_type",
      label: "Type",
      type: "select",
      options: [
        { value: "vendor", label: "Vendor" },
        { value: "incumbent", label: "Incumbent" },
        { value: "internal_build", label: "Internal build" },
        { value: "status_quo", label: "Status quo" },
        { value: "do_nothing", label: "Do nothing" },
        { value: "budget", label: "Competing budget" },
      ],
    },
    {
      name: "position",
      label: "Their position",
      type: "select",
      options: [
        { value: "unknown", label: "Unknown" },
        { value: "trailing", label: "Trailing" },
        { value: "even", label: "Even" },
        { value: "leading", label: "Leading" },
      ],
    },
    { name: "strengths", label: "Strengths", type: "textarea" },
    { name: "weaknesses", label: "Weaknesses", type: "textarea" },
    { name: "our_strategy", label: "Our win strategy", type: "textarea" },
  ],
};

export const RISKS: RecordConfig = {
  table: "deal_risks",
  title: "Risks",
  description: "Severity, probability, owner, mitigation and due date.",
  primaryField: "description",
  metaFields: ["severity", "probability", "owner_name", "due_date", "status"],
  fields: [
    { name: "description", label: "Risk", type: "text", required: true },
    {
      name: "severity",
      label: "Severity",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
    {
      name: "probability",
      label: "Probability",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
    { name: "mitigation", label: "Mitigation", type: "textarea" },
    { name: "owner_name", label: "Owner", type: "text" },
    { name: "due_date", label: "Due date", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "open", label: "Open" },
        { value: "mitigating", label: "Mitigating" },
        { value: "closed", label: "Closed" },
      ],
    },
  ],
};

export const NEXT_ACTIONS: RecordConfig = {
  table: "deal_next_actions",
  title: "Next Actions",
  description: "A deal without an open customer-owned next step is stalled.",
  primaryField: "description",
  metaFields: ["owner_side", "owner_name", "due_date", "status"],
  fields: [
    { name: "description", label: "Action", type: "text", required: true },
    {
      name: "owner_side",
      label: "Owned by",
      type: "select",
      options: [
        { value: "customer", label: "Customer" },
        { value: "seller", label: "Us" },
      ],
    },
    { name: "owner_name", label: "Owner name", type: "text" },
    { name: "due_date", label: "Due date", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "open", label: "Open" },
        { value: "done", label: "Done" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
  ],
};