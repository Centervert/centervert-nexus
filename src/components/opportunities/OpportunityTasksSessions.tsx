import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Clock, Circle, Calendar as CalendarIcon, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface OpportunityTasksSessionsProps {
  opportunityId: string;
}

export const OpportunityTasksSessions = ({ opportunityId }: OpportunityTasksSessionsProps) => {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", due_date: undefined as Date | undefined });
  const [newSession, setNewSession] = useState({ 
    task_title: "", 
    duration_minutes: "", 
    notes: "",
    task_id: null as string | null 
  });
  
  const queryClient = useQueryClient();

  // Fetch open tasks
  const { data: openTasks } = useQuery({
    queryKey: ["opportunity-tasks", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_tasks")
        .select("*, assigned_user:profiles!opportunity_tasks_assigned_to_fkey(full_name), created_user:profiles!opportunity_tasks_created_by_fkey(full_name)")
        .eq("opportunity_id", opportunityId)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch work sessions
  const { data: sessions } = useQuery({
    queryKey: ["opportunity-sessions", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_work_sessions")
        .select("*, logged_user:profiles!opportunity_work_sessions_logged_by_fkey(full_name)")
        .eq("opportunity_id", opportunityId)
        .order("session_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: typeof newTask) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("opportunity_tasks").insert({
        opportunity_id: opportunityId,
        title: task.title,
        description: task.description,
        due_date: task.due_date?.toISOString(),
        created_by: user.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-tasks", opportunityId] });
      setShowTaskDialog(false);
      setNewTask({ title: "", description: "", due_date: undefined });
      toast.success("Task created successfully");
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (session: typeof newSession) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("opportunity_work_sessions").insert({
        opportunity_id: opportunityId,
        task_id: session.task_id,
        task_title: session.task_title,
        duration_minutes: parseFloat(session.duration_minutes),
        notes: session.notes,
        logged_by: user.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-sessions", opportunityId] });
      setShowSessionDialog(false);
      setNewSession({ task_title: "", duration_minutes: "", notes: "", task_id: null });
      toast.success("Work session logged successfully");
    },
  });

  // Mark task as complete
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("opportunity_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-tasks", opportunityId] });
      toast.success("Task marked as complete");
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const handleCreateSession = () => {
    if (!newSession.task_title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!newSession.duration_minutes || parseFloat(newSession.duration_minutes) <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    createSessionMutation.mutate(newSession);
  };

  const totalHours = sessions?.reduce((sum, s) => sum + parseFloat(s.duration_minutes.toString()), 0) / 60 || 0;

  return (
    <div className="space-y-6">
      {/* Open Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Open Tasks</h3>
          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
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
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Add notes..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTask.due_date ? format(newTask.due_date, "PPP") : "Add Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newTask.due_date}
                        onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={handleCreateTask} className="w-full" disabled={createTaskMutation.isPending}>
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {openTasks?.map((task) => (
            <Card key={task.id} className="p-0 overflow-hidden border-border/50 hover:border-border transition-colors">
              <button
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-accent/5 transition-colors"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    completeTaskMutation.mutate(task.id);
                  }}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Circle className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{task.title}</p>
                    {expandedTask === task.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </div>
                  {task.due_date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Due {format(new Date(task.due_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </button>
              
              {expandedTask === task.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3 bg-accent/5">
                  {task.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{task.description}</p>
                    </div>
                  )}
                  {task.assigned_user && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                      <p className="text-sm">{task.assigned_user.full_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created By</p>
                    <p className="text-sm">{task.created_user?.full_name || "Unknown"}</p>
                  </div>
                </div>
              )}
            </Card>
          ))}
          
          {openTasks?.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No open tasks</p>
            </Card>
          )}
        </div>
      </div>

      {/* Work Sessions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Work Sessions</h3>
            <p className="text-sm text-muted-foreground">Total: {totalHours.toFixed(1)} hours</p>
          </div>
          <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Clock className="h-4 w-4" />
                Log Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Work Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task</Label>
                  <Select
                    value={newSession.task_id || "custom"}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setNewSession({ ...newSession, task_id: null, task_title: "" });
                      } else {
                        const task = openTasks?.find(t => t.id === value);
                        setNewSession({ 
                          ...newSession, 
                          task_id: value, 
                          task_title: task?.title || "" 
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task or enter custom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Task</SelectItem>
                      {openTasks?.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {!newSession.task_id && (
                  <div>
                    <Label>Custom Task Title</Label>
                    <Input
                      placeholder="Enter task title..."
                      value={newSession.task_title}
                      onChange={(e) => setNewSession({ ...newSession, task_title: e.target.value })}
                    />
                  </div>
                )}
                
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={newSession.duration_minutes}
                    onChange={(e) => setNewSession({ ...newSession, duration_minutes: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="What did you work on?"
                    value={newSession.notes}
                    onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button onClick={handleCreateSession} className="w-full" disabled={createSessionMutation.isPending}>
                  Log Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {sessions?.map((session) => (
            <Card key={session.id} className="p-4 border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{session.task_title}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {(parseFloat(session.duration_minutes.toString()) / 60).toFixed(1)}h
                    </span>
                    <span>{format(new Date(session.session_date), "MMM d, yyyy")}</span>
                    <span>{session.logged_user?.full_name}</span>
                  </div>
                  {session.notes && (
                    <p className="text-sm mt-2">{session.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {sessions?.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No work sessions logged</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};