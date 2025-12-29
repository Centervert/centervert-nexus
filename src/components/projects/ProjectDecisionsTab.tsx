import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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

interface Decision {
  id: string;
  title: string;
  description: string | null;
  status: string;
  decision_date: string | null;
  created_at: string | null;
}

interface ProjectDecisionsTabProps {
  projectId: string;
}

export function ProjectDecisionsTab({ projectId }: ProjectDecisionsTabProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    decision_date: ""
  });

  useEffect(() => {
    loadDecisions();
  }, [projectId]);

  const loadDecisions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_decisions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading decisions:", error);
      toast.error("Failed to load decisions");
    } else {
      setDecisions(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Decision title is required");
      return;
    }

    try {
      if (editingDecision) {
        const { error } = await supabase
          .from("project_decisions")
          .update({
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            decision_date: formData.decision_date || null
          })
          .eq("id", editingDecision.id);

        if (error) throw error;
        toast.success("Decision updated");
      } else {
        const { error } = await supabase
          .from("project_decisions")
          .insert({
            project_id: projectId,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            decision_date: formData.decision_date || null
          });

        if (error) throw error;
        toast.success("Decision added");
      }

      setDialogOpen(false);
      resetForm();
      loadDecisions();
    } catch (error) {
      console.error("Error saving decision:", error);
      toast.error("Failed to save decision");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_decisions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Decision deleted");
      loadDecisions();
    } catch (error) {
      console.error("Error deleting decision:", error);
      toast.error("Failed to delete decision");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "pending",
      decision_date: ""
    });
    setEditingDecision(null);
  };

  const openEditDialog = (decision: Decision) => {
    setEditingDecision(decision);
    setFormData({
      title: decision.title,
      description: decision.description || "",
      status: decision.status,
      decision_date: decision.decision_date || ""
    });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "decided": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Decisions</h2>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Decision
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : decisions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No decisions yet. Record your first decision.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {decisions.map((decision) => (
            <Card 
              key={decision.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openEditDialog(decision)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{decision.title}</p>
                    {decision.description && (
                      <p className="text-sm text-muted-foreground mt-1">{decision.description}</p>
                    )}
                    {decision.decision_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Decision date: {format(new Date(decision.decision_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(decision.status)}>
                    {decision.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDecision ? "Edit Decision" : "Add Decision"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Decision title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Decision details and rationale"
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="decided">Decided</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decision_date">Decision Date</Label>
                <Input
                  id="decision_date"
                  type="date"
                  value={formData.decision_date}
                  onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingDecision && (
              <Button 
                variant="destructive" 
                onClick={() => { handleDelete(editingDecision.id); setDialogOpen(false); }}
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
