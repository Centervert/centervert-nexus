export const SOCIAL_PLATFORMS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["value"];

export const SOCIAL_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "needs_review", label: "Needs Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "posted", label: "Posted" },
] as const;

export type SocialStatus = (typeof SOCIAL_STATUSES)[number]["value"];

export const statusTextClass = (status: string) => {
  switch (status) {
    case "posted":
      return "text-green-600";
    case "scheduled":
      return "text-blue-600";
    case "approved":
      return "text-emerald-600";
    case "needs_review":
      return "text-amber-600";
    default:
      return "text-muted-foreground";
  }
};

export const platformLabel = (value: string) =>
  SOCIAL_PLATFORMS.find((p) => p.value === value)?.label ?? value;

export const statusLabel = (value: string) =>
  SOCIAL_STATUSES.find((s) => s.value === value)?.label ?? value;

export interface SocialPost {
  id: string;
  title: string;
  copy: string | null;
  platforms: string[];
  media_urls: string[];
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  organization_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Builds a 6-week grid (Sun-start) covering the given month. */
export const buildMonthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
  });
};

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
