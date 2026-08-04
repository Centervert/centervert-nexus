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

        <ActivityTimeline showLinks limit={200} typeFilter={type} />
      </div>

      <ActivityDialog open={open} onOpenChange={setOpen} />
    </UnifiedLayout>
  );
}
