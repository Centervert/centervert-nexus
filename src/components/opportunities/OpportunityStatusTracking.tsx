import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface OpportunityStatusTrackingProps {
  opportunityId: string;
  currentStatus: string;
}

interface StatusChange {
  id: string;
  content: string;
  created_at: string;
  metadata: any;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

const STATUS_ORDER = [
  { value: "lead", label: "Lead" },
  { value: "working_on_rfp", label: "Working on RFP" },
  { value: "submitted", label: "Submitted" },
  { value: "awarded", label: "Awarded" },
];

const TERMINAL_STATUSES = [
  { value: "lost", label: "Lost" },
  { value: "on_hold", label: "On Hold" },
];

export function OpportunityStatusTracking({ opportunityId, currentStatus }: OpportunityStatusTrackingProps) {
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatusHistory();
  }, [opportunityId]);

  const loadStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunity_updates")
        .select(
          `
          id,
          content,
          created_at,
          metadata,
          profiles:created_by (full_name, email)
        `
        )
        .eq("opportunity_id", opportunityId)
        .eq("update_type", "status_change")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setStatusHistory(data || []);
    } catch (error) {
      console.error("Error loading status history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return STATUS_ORDER.findIndex((s) => s.value === status);
  };

  const currentStatusIndex = getStatusIndex(currentStatus);
  const isTerminalStatus = TERMINAL_STATUSES.some((s) => s.value === currentStatus);

  const getStatusLabel = (status: string) => {
    const normalStatus = STATUS_ORDER.find((s) => s.value === status);
    if (normalStatus) return normalStatus.label;
    const terminalStatus = TERMINAL_STATUSES.find((s) => s.value === status);
    return terminalStatus?.label || status;
  };

  const renderProgressStep = (status: typeof STATUS_ORDER[0], index: number) => {
    const isPast = index < currentStatusIndex;
    const isCurrent = index === currentStatusIndex;
    const isFuture = index > currentStatusIndex;

    return (
      <div key={status.value} className="flex flex-col items-center relative">
        {index > 0 && (
          <div
            className={`absolute right-1/2 top-5 w-full h-0.5 transition-colors ${
              isPast ? "bg-primary" : "bg-muted"
            }`}
            style={{ left: "-50%" }}
          />
        )}
        
        <div className="relative z-10 flex flex-col items-center">
          {isCurrent ? (
            <CheckCircle2 className="h-10 w-10 text-primary" />
          ) : isPast ? (
            <CheckCircle2 className="h-10 w-10 text-primary" />
          ) : (
            <Circle className="h-10 w-10 text-muted-foreground" />
          )}
          <p
            className={`mt-2 text-sm font-medium text-center ${
              isCurrent ? "text-foreground" : isPast ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {status.label}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status Badge */}
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Current Status</p>
            <p className="text-lg font-semibold capitalize">{getStatusLabel(currentStatus)}</p>
          </div>
        </div>

        {/* Progress Timeline - Only show if not a terminal status */}
        {!isTerminalStatus && (
          <div className="relative">
            <div className="grid grid-cols-4 gap-4">
              {STATUS_ORDER.map((status, index) => renderProgressStep(status, index))}
            </div>
          </div>
        )}

        {/* Terminal Status Display */}
        {isTerminalStatus && (
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-lg font-semibold capitalize">{getStatusLabel(currentStatus)}</p>
              <p className="text-sm text-muted-foreground">Final Status</p>
            </div>
          </div>
        )}

        {/* Status History */}
        {!isLoading && statusHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Status History</h4>
            <div className="space-y-2">
              {statusHistory.map((change) => (
                <div key={change.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3 py-2">
                  <div className="flex-1">
                    <p className="font-medium">{change.content}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      {format(new Date(change.created_at), "MMM d, yyyy 'at' h:mm a")} by{" "}
                      {change.profiles?.full_name || change.profiles?.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
