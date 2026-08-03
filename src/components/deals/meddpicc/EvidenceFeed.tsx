import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ELEMENTS } from "@/lib/meddpicc";

interface Row {
  id: string;
  element: string | null;
  note: string;
  source: string | null;
  occurred_on: string;
  confirmed_by: string | null;
}

export function EvidenceFeed({ dealId }: { dealId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("deal_evidence")
        .select("id, element, note, source, occurred_on, confirmed_by")
        .eq("deal_id", dealId)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
      setRows((data || []) as Row[]);
      setLoading(false);
    })();
  }, [dealId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading evidence...</p>;
  if (rows.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No evidence yet. Add evidence from the qualification element cards.
      </p>
    );

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="flex gap-3 text-sm">
          <span className="text-muted-foreground w-24 shrink-0">
            {new Date(r.occurred_on).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <div className="min-w-0">
            <p>{r.note}</p>
            <p className="text-xs text-muted-foreground">
              {ELEMENTS.find((e) => e.key === r.element)?.label ?? "General"}
              {r.source && ` · ${r.source}`}
              {r.confirmed_by && ` · confirmed by ${r.confirmed_by}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}