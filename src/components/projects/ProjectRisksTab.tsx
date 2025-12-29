import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle } from "lucide-react";
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

interface Risk {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  likelihood: string;
  status: string;
  mitigation: string | null;
}

interface ProjectRisksTabProps {
  projectId: string;
}

export function ProjectRisksTab({ projectId }: ProjectRisksTabProps) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
    likelihood: "medium",
    status: "open",
    mitigation: ""
  });

  useEffect(() => {
    loadRisks();
  }, [projectId]);

  const loadRisks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_risks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading risks:", error);
      toast.error("Failed to load risks");
    } else {
      setRisks(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Risk title is required");
      return;
    }

    try {
      if (editingRisk) {
        const { error } = await supabase
          .from("project_risks")
          .update({
            title: formData.title,
            description: formData.description || null,
            severity: formData.severity,
            likelihood: formData.likelihood,
            status: formData.status,
            mitigation: formData.mitigation || null
          })
          .eq("id", editingRisk.id);

        if (error) throw error;
        toast.success("Risk updated");
      } else {
        const { error } = await supabase
          .from("project_risks")
          .insert({
            project_id: projectId,
            title: formData.title,
            description: formData.description || null,
            severity: formData.severity,
            likelihood: formData.likelihood,
            status: formData.status,
            mitigation: formData.mitigation || null
          });

        if (error) throw error;
        toast.success("Risk added");
      }

      setDialogOpen(false);
      resetForm();
      loadRisks();
    } catch (error) {
      console.error("Error saving risk:", error);
      toast.error("Failed to save risk");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_risks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Risk deleted");
      loadRisks();
    } catch (error) {
      console.error("Error deleting risk:", error);
      toast.error("Failed to delete risk");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      severity: "medium",
      likelihood: "medium",
      status: "open",
      mitigation: ""
    });
    setEditingRisk(null);
  };

  const openEditDialog = (risk: Risk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description || "",
      severity: risk.severity,
      likelihood: risk.likelihood,
      status: risk.status,
      mitigation: risk.mitigation || ""
    });
    setDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low": return "bg-green-500/10 text-green-600 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "mitigated": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "closed": return "bg-green-500/10 text-green-600 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Risks</h2>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Risk
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : risks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No risks identified yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {risks.map((risk) => (
            <Card 
              key={risk.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openEditDialog(risk)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{risk.title}</p>
                    {risk.description && (
                      <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                    )}
                    {risk.mitigation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(risk.severity)}>
                      {risk.severity}
                    </Badge>
                    <Badge className={getStatusColor(risk.status)}>
                      {risk.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRisk ? "Edit Risk" : "Add Risk"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Risk title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Risk description"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
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
                <Label>Likelihood</Label>
                <Select value={formData.likelihood} onValueChange={(v) => setFormData({ ...formData, likelihood: v })}>
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
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mitigation">Mitigation Plan</Label>
              <Textarea
                id="mitigation"
                value={formData.mitigation}
                onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                placeholder="How will this risk be mitigated?"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingRisk && (
              <Button 
                variant="destructive" 
                onClick={() => { handleDelete(editingRisk.id); setDialogOpen(false); }}
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
