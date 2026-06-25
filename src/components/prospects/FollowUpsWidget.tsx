import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function FollowUpsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: visits, refetch } = useQuery({
    queryKey: ["my-follow-ups", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("prospect_visits")
        .select("id, follow_up_due, person_spoken_to, prospect_id, prospects(name, address)")
        .eq("rep_id", user.id)
        .eq("follow_up_done", false)
        .not("follow_up_due", "is", null)
        .order("follow_up_due", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const markDone = async (id: string) => {
    const { error } = await supabase
      .from("prospect_visits")
      .update({ follow_up_done: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    refetch();
  };

  if (!visits || visits.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Follow-ups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visits.map((v: any) => {
          const due = v.follow_up_due ? new Date(v.follow_up_due) : null;
          const overdue = due && isPast(due) && !isToday(due);
          return (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 p-2 rounded hover:bg-muted/50"
            >
              <button
                className="flex-1 text-left"
                onClick={() => navigate(`/prospects/${v.prospect_id}`)}
              >
                <div className="font-medium text-sm">{v.prospects?.name ?? "Prospect"}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {v.prospects?.address ?? "No address"}
                </div>
              </button>
              <div className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                {due ? format(due, "MMM d") : ""}
              </div>
              <Button size="icon" variant="ghost" onClick={() => markDone(v.id)} title="Mark done">
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}