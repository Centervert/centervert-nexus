import { useState } from "react";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDialog } from "@/components/tasks/TaskDialog";

export default function Tasks() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"mine" | "overdue" | "open" | "all">("mine");

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">What we owe the customer, and what the customer owes us.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New task
          </Button>
        </div>

        <Tabs value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
          <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start">
            {[
              { v: "mine", l: "My Tasks" },
              { v: "overdue", l: "Overdue" },
              { v: "open", l: "All Open" },
              { v: "all", l: "Everything" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                {t.l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <TaskList scope={scope} showLinks showAddButton={false} emptyMessage="Nothing here — good place to be." />
      </div>

      <TaskDialog open={open} onOpenChange={setOpen} />
    </UnifiedLayout>
  );
}
