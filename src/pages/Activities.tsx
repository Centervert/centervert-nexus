import { useState } from "react";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { ActivityDialog } from "@/components/activities/ActivityDialog";
import { ACTIVITY_TYPES } from "@/lib/crm";

export default function Activities() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("all");

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
            <p className="text-muted-foreground">Every interaction across prospecting and opportunities.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log activity
          </Button>
        </div>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity types</SelectItem>
            {ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TimelineWrapper type={type} />
      </div>

      <ActivityDialog open={open} onOpenChange={setOpen} />
    </UnifiedLayout>
  );
}

function TimelineWrapper({ type }: { type: string }) {
  // The timeline component handles record-level filters; type filtering is applied here
  // by keying the query and filtering client-side through a wrapper element.
  return (
    <div data-activity-filter={type}>
      <FilteredTimeline type={type} />
    </div>
  );
}

function FilteredTimeline({ type }: { type: string }) {
  if (type === "all") return <ActivityTimeline showLinks limit={200} />;
  return <ActivityTimeline showLinks limit={200} typeFilter={type} />;
}
