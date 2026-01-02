import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  task_type: string;
  story_points: number | null;
  due_date: string | null;
  feature_id: string | null;
}

interface Feature {
  id: string;
  name: string;
}

interface ProjectTicketsTabProps {
  projectId: string;
}

export function ProjectTicketsTab({ projectId }: ProjectTicketsTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "backlog",
    priority: "medium",
    task_type: "todo",
    story_points: "",
    due_date: "",
    feature_id: ""
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadTasks(), loadFeatures()]);
    setLoading(false);
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } else {
      setTasks(data || []);
    }
  };

  const loadFeatures = async () => {
    const { data, error } = await supabase
      .from("project_features")
      .select("id, name")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading features:", error);
    } else {
      setFeatures(data || []);
    }
  };

  const getFeatureName = (featureId: string | null) => {
    if (!featureId) return null;
    return features.find(f => f.id === featureId)?.name || null;
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      if (editingTask) {
        const { error } = await supabase
          .from("project_tasks")
          .update({
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            task_type: formData.task_type,
            story_points: formData.story_points ? parseInt(formData.story_points) : null,
            due_date: formData.due_date || null,
            feature_id: formData.feature_id || null
          })
          .eq("id", editingTask.id);

        if (error) throw error;
        toast.success("Task updated");
      } else {
        const { error } = await supabase
          .from("project_tasks")
          .insert({
            project_id: projectId,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            task_type: formData.task_type,
            story_points: formData.story_points ? parseInt(formData.story_points) : null,
            due_date: formData.due_date || null,
            feature_id: formData.feature_id || null,
            position: tasks.length
          });

        if (error) throw error;
        toast.success("Task added");
      }

      setDialogOpen(false);
      resetForm();
      loadTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Task deleted");
      loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "backlog",
      priority: "medium",
      task_type: "todo",
      story_points: "",
      due_date: "",
      feature_id: ""
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority || "medium",
      task_type: task.task_type,
      story_points: task.story_points?.toString() || "",
      due_date: task.due_date || "",
      feature_id: task.feature_id || ""
    });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "review": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "backlog": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low": return "bg-green-500/10 text-green-600 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bug": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "feature": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "todo": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tickets</h2>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tickets yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const featureName = getFeatureName(task.feature_id);
            return (
              <Card 
                key={task.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openEditDialog(task)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Ticket className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {featureName && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          {featureName}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Badge className={getTypeColor(task.task_type)}>
                        {task.task_type}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority || "medium"}
                      </Badge>
                      {task.story_points && (
                        <Badge variant="outline">{task.story_points} pts</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Ticket" : "Add Ticket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ticket title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ticket description"
              />
            </div>
            
            {/* Feature Link */}
            <div className="space-y-2">
              <Label>Link to Feature</Label>
              <Select value={formData.feature_id} onValueChange={(v) => setFormData({ ...formData, feature_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No feature</SelectItem>
                  {features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.task_type} onValueChange={(v) => setFormData({ ...formData, task_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="story_points">Story Points</Label>
                <Input
                  id="story_points"
                  type="number"
                  value={formData.story_points}
                  onChange={(e) => setFormData({ ...formData, story_points: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingTask && (
              <Button 
                variant="destructive" 
                onClick={() => { handleDelete(editingTask.id); setDialogOpen(false); }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
