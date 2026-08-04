import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { activityLabel } from "@/lib/crm";

export interface TimelineFilter {
  organization_id?: string;
  contact_id?: string;
  prospect_id?: string;
  deal_id?: string;
}

interface Props {
  filter?: TimelineFilter;
  limit?: number;
  typeFilter?: string;
  showLinks?: boolean;
  emptyMessage?: string;
}

export function ActivityTimeline({ filter, limit = 100, typeFilter, showLinks = false, emptyMessage = "No activity logged yet." }: Props) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["activities", filter, limit, typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("activities")
        .select("*, prospects(id, name), deals(id, name), organizations(id, name), contacts(id, first_name, last_name)")
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (filter?.organization_id) q = q.eq("organization_id", filter.organization_id);
      if (filter?.contact_id) q = q.eq("contact_id", filter.contact_id);
      if (filter?.prospect_id) q = q.eq("prospect_id", filter.prospect_id);
      if (filter?.deal_id) q = q.eq("deal_id", filter.deal_id);
      if (typeFilter && typeFilter !== "all") q = q.eq("activity_type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;

  return (
    <div className="space-y-3">
      {rows.map((a: any) => (
        <div key={a.id} className="border-l-2 border-muted pl-4 pb-3 relative">
          <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-medium">{activityLabel(a.activity_type)}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(a.occurred_at), "MMM d, yyyy • h:mm a")}
            </span>
            {a.interest_level && (
              <span className="text-xs text-muted-foreground">Interest: {a.interest_level}</span>
            )}
          </div>
          {a.subject && <p className="text-sm mt-0.5">{a.subject}</p>}
          {a.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">{a.body}</p>}
          <div className="text-xs text-muted-foreground mt-1 space-x-3">
            {a.person_spoken_to && <span>Spoke with {a.person_spoken_to}</span>}
            {a.outcome && <span>{a.outcome}</span>}
            {a.left_behind && <span>Left: {a.left_behind}</span>}
            {a.follow_up_on && <span>Follow up {format(new Date(a.follow_up_on), "MMM d")}</span>}
          </div>
          {showLinks && (
            <div className="text-xs mt-1 space-x-3">
              {a.prospects && <Link className="text-primary hover:underline" to={`/prospects/${a.prospects.id}`}>{a.prospects.name}</Link>}
              {a.deals && <Link className="text-primary hover:underline" to={`/deals/${a.deals.id}`}>{a.deals.name}</Link>}
              {a.organizations && <Link className="text-primary hover:underline" to={`/organizations/${a.organizations.id}`}>{a.organizations.name}</Link>}
              {a.contacts && <Link className="text-primary hover:underline" to={`/contacts/${a.contacts.id}`}>{a.contacts.first_name} {a.contacts.last_name}</Link>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
