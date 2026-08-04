import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Star } from "lucide-react";

interface Props {
  prospect: any;
}

export function ProspectPeople({ prospect }: Props) {
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["prospect-people", prospect.id, prospect.organization_id, prospect.primary_contact_id],
    queryFn: async () => {
      const ids: string[] = [];
      if (prospect.primary_contact_id) ids.push(prospect.primary_contact_id);
      let rows: any[] = [];
      if (prospect.organization_id) {
        const { data } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email, phone, title")
          .eq("organization_id", prospect.organization_id);
        rows = data ?? [];
      }
      const missing = ids.filter((i) => !rows.some((r) => r.id === i));
      if (missing.length) {
        const { data } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email, phone, title")
          .in("id", missing);
        rows = [...(data ?? []), ...rows];
      }
      return rows;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>;

  if (people.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No people linked yet. Link a company or primary person from Edit.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {people.map((p: any) => (
        <div key={p.id} className="border rounded-lg p-3 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Link to={`/contacts/${p.id}`} className="font-medium text-primary hover:underline flex items-center gap-1.5">
              {p.first_name} {p.last_name}
              {p.id === prospect.primary_contact_id && <Star className="h-3 w-3 text-amber-500" />}
            </Link>
            {p.title && <p className="text-xs text-muted-foreground">{p.title}</p>}
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5 text-right">
            {p.email && (
              <div className="flex items-center gap-1 justify-end"><Mail className="h-3 w-3" />{p.email}</div>
            )}
            {p.phone && (
              <div className="flex items-center gap-1 justify-end"><Phone className="h-3 w-3" />{p.phone}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}