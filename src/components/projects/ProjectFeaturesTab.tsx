import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Ticket, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

interface Feature {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string | null;
  target_date: string | null;
  position: number | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  task_type: string;
  story_points: number | null;
  feature_id: string | null;
}

interface ProjectFeaturesTabProps {
  projectId: string;
}

export function ProjectFeaturesTab({ projectId }: ProjectFeaturesTabProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planned",
    priority: "medium",
    target_date: ""
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadFeatures(), loadTasks()]);
    setLoading(false);
  };

  const loadFeatures = async () => {
    const { data, error } = await supabase
      .from("project_features")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading features:", error);
      toast.error("Failed to load features");
    } else {
      setFeatures(data || []);
    }
  };

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("project_tasks")
      .select("id, title, description, status, priority, task_type, story_points, feature_id")
      .eq("project_id", projectId);

    if (error) {
      console.error("Error loading tasks:", error);
    } else {
      setTasks(data || []);
    }
  };

  const getFeatureTicketCount = (featureId: string) => {
    return tasks.filter(t => t.feature_id === featureId).length;
  };

  const getFeatureTickets = (featureId: string) => {
    return tasks.filter(t => t.feature_id === featureId);
  };

  const getUnlinkedTickets = () => {
    return tasks.filter(t => !t.feature_id);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Feature name is required");
      return;
    }

    try {
      if (editingFeature) {
        const { error } = await supabase
          .from("project_features")
          .update({
            name: formData.name,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            target_date: formData.target_date || null
          })
          .eq("id", editingFeature.id);

        if (error) throw error;
        toast.success("Feature updated");
      } else {
        const { error } = await supabase
          .from("project_features")
          .insert({
            project_id: projectId,
            name: formData.name,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            target_date: formData.target_date || null,
            position: features.length
          });

        if (error) throw error;
        toast.success("Feature added");
      }

      setDialogOpen(false);
      resetForm();
      loadFeatures();
    } catch (error) {
      console.error("Error saving feature:", error);
      toast.error("Failed to save feature");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Unlink any tickets first
      await supabase
        .from("project_tasks")
        .update({ feature_id: null })
        .eq("feature_id", id);

      const { error } = await supabase
        .from("project_features")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Feature deleted");
      setDetailSheetOpen(false);
      setSelectedFeature(null);
      loadData();
    } catch (error) {
      console.error("Error deleting feature:", error);
      toast.error("Failed to delete feature");
    }
  };

  const handleLinkTicket = async (taskId: string, featureId: string | null) => {
    try {
      const { error } = await supabase
        .from("project_tasks")
        .update({ feature_id: featureId })
        .eq("id", taskId);

      if (error) throw error;
      toast.success(featureId ? "Ticket linked to feature" : "Ticket unlinked");
      loadTasks();
    } catch (error) {
      console.error("Error linking ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "planned",
      priority: "medium",
      target_date: ""
    });
    setEditingFeature(null);
  };

  const openEditDialog = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description || "",
      status: feature.status,
      priority: feature.priority || "medium",
      target_date: feature.target_date || ""
    });
    setDialogOpen(true);
  };

  const openDetailSheet = (feature: Feature) => {
    setSelectedFeature(feature);
    setDetailSheetOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "planned": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "review": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Features</h2>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : features.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No features yet. Add your first feature to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {features.map((feature) => {
            const ticketCount = getFeatureTicketCount(feature.id);
            return (
              <Card 
                key={feature.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openDetailSheet(feature)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{feature.name}</p>
                      {feature.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{feature.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ticketCount > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          {ticketCount}
                        </Badge>
                      )}
                      <Badge className={getStatusColor(feature.status)}>
                        {feature.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge className={getPriorityColor(feature.priority)}>
                        {feature.priority || "medium"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Feature Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFeature ? "Edit Feature" : "Add Feature"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Feature name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Feature description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedFeature && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedFeature.name}</SheetTitle>
                {selectedFeature.description && (
                  <SheetDescription>{selectedFeature.description}</SheetDescription>
                )}
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Feature Info */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(selectedFeature.status)}>
                    {selectedFeature.status.replace(/_/g, " ")}
                  </Badge>
                  <Badge className={getPriorityColor(selectedFeature.priority)}>
                    {selectedFeature.priority || "medium"}
                  </Badge>
                  {selectedFeature.target_date && (
                    <Badge variant="outline">
                      Target: {new Date(selectedFeature.target_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                {/* Linked Tickets */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Linked Tickets ({getFeatureTickets(selectedFeature.id).length})
                  </h3>
                  
                  {getFeatureTickets(selectedFeature.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tickets linked to this feature.</p>
                  ) : (
                    <div className="space-y-2">
                      {getFeatureTickets(selectedFeature.id).map((task) => (
                        <Card key={task.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getTaskStatusColor(task.status)} variant="outline">
                                  {task.status.replace(/_/g, " ")}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLinkTicket(task.id, null)}
                                >
                                  Unlink
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unlinked Tickets to Link */}
                {getUnlinkedTickets().length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Link Tickets</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {getUnlinkedTickets().map((task) => (
                        <Card key={task.id} className="hover:bg-muted/50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{task.title}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLinkTicket(task.id, selectedFeature.id)}
                              >
                                Link
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => openEditDialog(selectedFeature)}>
                    Edit Feature
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedFeature.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
