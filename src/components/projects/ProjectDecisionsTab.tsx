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
  decision: string | null;
  status: string;
  decided_at: string | null;
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
    decision: "",
    status: "pending",
    decided_at: ""
  });

  useEffect(() => {
    loadDecisions();
  }, [projectId]);

  const loadDecisions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_decisions")
      .select("id, title, description, decision, status, decided_at, created_at")
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
            decision: formData.decision || null,
            status: formData.status,
            decided_at: formData.decided_at || null
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
            decision: formData.decision || null,
            status: formData.status,
            decided_at: formData.decided_at || null
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
      decision: "",
      status: "pending",
      decided_at: ""
    });
    setEditingDecision(null);
  };

  const openEditDialog = (decision: Decision) => {
    setEditingDecision(decision);
    setFormData({
      title: decision.title,
      description: decision.description || "",
      decision: decision.decision || "",
      status: decision.status,
      decided_at: decision.decided_at ? decision.decided_at.split('T')[0] : ""
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
                    {decision.decision && (
                      <p className="text-sm mt-2 p-2 bg-muted/50 rounded">
                        <strong>Decision:</strong> {decision.decision}
                      </p>
                    )}
                    {decision.decided_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Decided: {format(new Date(decision.decided_at), "MMM d, yyyy")}
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
                placeholder="Context and background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decision">Decision</Label>
              <Textarea
                id="decision"
                value={formData.decision}
                onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                placeholder="The final decision made"
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
                <Label htmlFor="decided_at">Decision Date</Label>
                <Input
                  id="decided_at"
                  type="date"
                  value={formData.decided_at}
                  onChange={(e) => setFormData({ ...formData, decided_at: e.target.value })}
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
