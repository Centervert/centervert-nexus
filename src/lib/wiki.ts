import {
  Code2,
  ListChecks,
  FileText,
  Palette,
  Server,
  Rocket,
  BarChart3,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";

export type WikiPageRow = {
  id: string;
  project_id: string | null;
  parent_id: string | null;
  title: string;
  body: string;
  page_type: string;
  position: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export interface WikiTreeNode extends WikiPageRow {
  children: WikiTreeNode[];
}

export function buildWikiTree(pages: WikiPageRow[]): WikiTreeNode[] {
  const map = new Map<string, WikiTreeNode>();
  pages.forEach((p) => map.set(p.id, { ...p, children: [] }));
  const roots: WikiTreeNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (nodes: WikiTreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export const PAGE_TEMPLATES: { value: string; label: string; body: (title: string) => string }[] = [
  { value: "blank", label: "Blank", body: () => "" },
  {
    value: "meeting_notes",
    label: "Meeting Notes",
    body: () =>
      [
        "## Attendees",
        "-",
        "",
        "## Agenda",
        "-",
        "",
        "## Notes",
        "-",
        "",
        "## Decisions",
        "-",
        "",
        "## Action Items",
        "- [ ] Owner — task — due",
      ].join("\n"),
  },
  {
    value: "process_doc",
    label: "Process Doc",
    body: () =>
      [
        "## Purpose",
        "",
        "## When to use this",
        "",
        "## Steps",
        "1.",
        "2.",
        "",
        "## Owner",
        "",
        "## Related links",
        "-",
      ].join("\n"),
  },
  {
    value: "architecture_note",
    label: "Architecture Note",
    body: () =>
      [
        "## Context",
        "",
        "## Decision",
        "",
        "## Alternatives considered",
        "-",
        "",
        "## Consequences",
        "-",
        "",
        "## Repos / services affected",
        "-",
      ].join("\n"),
  },
  {
    value: "runbook",
    label: "Runbook",
    body: () =>
      [
        "## What this covers",
        "",
        "## Prerequisites / access needed",
        "-",
        "",
        "## Procedure",
        "1.",
        "",
        "## Rollback",
        "",
        "## Escalation",
      ].join("\n"),
  },
];

export function templateBody(value: string, title: string) {
  return PAGE_TEMPLATES.find((t) => t.value === value)?.body(title) ?? "";
}

export const LINK_CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "code", label: "Code", icon: Code2 },
  { value: "work_tracking", label: "Work Tracking", icon: ListChecks },
  { value: "docs", label: "Docs", icon: FileText },
  { value: "design", label: "Design", icon: Palette },
  { value: "environments", label: "Environments", icon: Server },
  { value: "cicd", label: "CI/CD", icon: Rocket },
  { value: "dashboards", label: "Dashboards", icon: BarChart3 },
  { value: "other", label: "Other", icon: LinkIcon },
];

export function linkCategory(value: string) {
  return LINK_CATEGORIES.find((c) => c.value === value) ?? LINK_CATEGORIES[LINK_CATEGORIES.length - 1];
}

export const SECRET_MANAGERS = [
  { value: "doppler", label: "Doppler" },
  { value: "aws_secrets_manager", label: "AWS Secrets Manager" },
  { value: "hashicorp_vault", label: "HashiCorp Vault" },
  { value: "onepassword", label: "1Password" },
  { value: "other", label: "Other" },
];

export const SECRET_ENVIRONMENTS = [
  { value: "all", label: "All" },
  { value: "dev", label: "Dev" },
  { value: "staging", label: "Staging" },
  { value: "prod", label: "Prod" },
];

export function labelFor(list: { value: string; label: string }[], value: string) {
  return list.find((i) => i.value === value)?.label ?? value;
}

/**
 * Heuristic guard: refuse anything that looks like a pasted credential.
 * The secrets register stores references only — never values.
 */
export function looksLikeSecretValue(input: string): boolean {
  const v = input.trim();
  if (!v) return false;
  const patterns = [
    /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/,
    /\bghp_[A-Za-z0-9]{20,}/,
    /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    /(password|passwd|secret|token|api[_-]?key)\s*[:=]\s*\S{6,}/i,
  ];
  if (patterns.some((p) => p.test(v))) return true;
  // Long high-entropy single token with no spaces
  if (!/\s/.test(v) && v.length >= 32 && /[A-Za-z]/.test(v) && /[0-9]/.test(v) && !/\//.test(v)) {
    return true;
  }
  return false;
}
