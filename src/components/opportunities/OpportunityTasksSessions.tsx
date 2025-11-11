import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Clock, CheckCircle2, Circle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface OpportunityTasksSessionsProps {
  opportunityId: string;
}

export function OpportunityTasksSessions({ opportunityId }: OpportunityTasksSessionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    task_title: "",
    duration_minutes: "",
    notes: "",
  });
  const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);

  // Fetch open tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["opportunity-tasks", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_tasks")
        .select("*, assigned_user:assigned_to(full_name), created_user:created_by(full_name)")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch work sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["opportunity-work-sessions", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_work_sessions")
        .select("*, logged_by_user:logged_by(full_name)")
        .eq("opportunity_id", opportunityId)
        .order("session_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("opportunity_tasks").insert({
        opportunity_id: opportunityId,
        title,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-tasks", opportunityId] });
      setNewTaskTitle("");
      toast({ title: "Task created" });
    },
  });

  // Toggle task status mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "completed" ? "open" : "completed";
      const { error } = await supabase
        .from("opportunity_tasks")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-tasks", opportunityId] });
    },
  });

  // Create work session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("opportunity_work_sessions").insert({
        opportunity_id: opportunityId,
        task_title: sessionForm.task_title,
        duration_minutes: parseFloat(sessionForm.duration_minutes),
        notes: sessionForm.notes || null,
        logged_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-work-sessions", opportunityId] });
      setSessionDialogOpen(false);
      setSessionForm({ task_title: "", duration_minutes: "", notes: "" });
      toast({ title: "Work session logged" });
    },
  });

  const openTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const totalSessionHours = sessions.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0) / 60;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Circle className="h-4 w-4" />
            Open Tasks
          </div>
          <div className="text-2xl font-semibold">{openTasks.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </div>
          <div className="text-2xl font-semibold">{completedTasks.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            Total Hours
          </div>
          <div className="text-2xl font-semibold">{totalSessionHours.toFixed(1)}</div>
        </Card>
      </div>

      {/* Open Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Open Tasks</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task Title</Label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title..."
                  />
                </div>
                <Button
                  onClick={() => createTaskMutation.mutate(newTaskTitle)}
                  disabled={!newTaskTitle.trim()}
                  className="w-full"
                >
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {openTasks.map((task) => (
            <Card
              key={task.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleTaskMutation.mutate({ taskId: task.id, currentStatus: task.status })}
            >
              <div className="flex items-start gap-3">
                <Circle className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{task.title}</p>
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {openTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No open tasks. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {/* Log Work Session */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Log Working Session</h3>
          <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Working Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task</Label>
                  <Popover open={taskSelectorOpen} onOpenChange={setTaskSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {sessionForm.task_title || "Select task or type custom..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Select or type task..."
                          value={sessionForm.task_title}
                          onValueChange={(value) => setSessionForm({ ...sessionForm, task_title: value })}
                        />
                        <CommandList>
                          <CommandEmpty>Type to create custom task</CommandEmpty>
                          <CommandGroup heading="Open Tasks">
                            {openTasks.map((task) => (
                              <CommandItem
                                key={task.id}
                                onSelect={() => {
                                  setSessionForm({ ...sessionForm, task_title: task.title });
                                  setTaskSelectorOpen(false);
                                }}
                              >
                                {task.title}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={sessionForm.duration_minutes}
                    onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: e.target.value })}
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                    placeholder="What did you work on?"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => createSessionMutation.mutate()}
                  disabled={!sessionForm.task_title.trim() || !sessionForm.duration_minutes}
                  className="w-full"
                >
                  Log Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Recent Sessions */}
        <div className="space-y-2">
          {sessions.slice(0, 5).map((session) => (
            <Card key={session.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{session.task_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.logged_by_user?.full_name} • {format(new Date(session.session_date), "MMM d, h:mm a")}
                  </p>
                  {session.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                  )}
                </div>
                <Badge variant="secondary" className="flex-shrink-0">
                  {Number(session.duration_minutes)}m
                </Badge>
              </div>
            </Card>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No work sessions logged yet.
            </div>
          )}
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-muted-foreground">Completed Tasks</h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <Card
                key={task.id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors opacity-60"
                onClick={() => toggleTaskMutation.mutate({ taskId: task.id, currentStatus: task.status })}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-through">{task.title}</p>
                    {task.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed {format(new Date(task.completed_at), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
