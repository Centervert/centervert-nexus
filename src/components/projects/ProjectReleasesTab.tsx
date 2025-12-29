import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Rocket } from "lucide-react";
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

interface Release {
  id: string;
  version: string;
  title: string;
  description: string | null;
  release_date: string | null;
  status: string;
}

interface ProjectReleasesTabProps {
  projectId: string;
}

export function ProjectReleasesTab({ projectId }: ProjectReleasesTabProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    status: "planned",
    release_date: ""
  });

  useEffect(() => {
    loadReleases();
  }, [projectId]);

  const loadReleases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_releases")
      .select("*")
      .eq("project_id", projectId)
      .order("release_date", { ascending: false });

    if (error) {
      console.error("Error loading releases:", error);
      toast.error("Failed to load releases");
    } else {
      setReleases(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.version.trim() || !formData.title.trim()) {
      toast.error("Version and title are required");
      return;
    }

    try {
      if (editingRelease) {
        const { error } = await supabase
          .from("project_releases")
          .update({
            version: formData.version,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            release_date: formData.release_date || null
          })
          .eq("id", editingRelease.id);

        if (error) throw error;
        toast.success("Release updated");
      } else {
        const { error } = await supabase
          .from("project_releases")
          .insert({
            project_id: projectId,
            version: formData.version,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            release_date: formData.release_date || null
          });

        if (error) throw error;
        toast.success("Release added");
      }

      setDialogOpen(false);
      resetForm();
      loadReleases();
    } catch (error) {
      console.error("Error saving release:", error);
      toast.error("Failed to save release");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("project_releases")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Release deleted");
      loadReleases();
    } catch (error) {
      console.error("Error deleting release:", error);
      toast.error("Failed to delete release");
    }
  };

  const resetForm = () => {
    setFormData({
      version: "",
      title: "",
      description: "",
      status: "planned",
      release_date: ""
    });
    setEditingRelease(null);
  };

  const openEditDialog = (release: Release) => {
    setEditingRelease(release);
    setFormData({
      version: release.version,
      title: release.title,
      description: release.description || "",
      status: release.status,
      release_date: release.release_date || ""
    });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "released": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "planned": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Releases</h2>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Release
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : releases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No releases yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {releases.map((release) => (
            <Card 
              key={release.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openEditDialog(release)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Rocket className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{release.version}</Badge>
                      <p className="font-medium">{release.title}</p>
                    </div>
                    {release.description && (
                      <p className="text-sm text-muted-foreground mt-1">{release.description}</p>
                    )}
                    {release.release_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(release.release_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(release.status)}>
                    {release.status.replace(/_/g, " ")}
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
            <DialogTitle>{editingRelease ? "Edit Release" : "Add Release"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="v1.0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Release title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Release notes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingRelease && (
              <Button 
                variant="destructive" 
                onClick={() => { handleDelete(editingRelease.id); setDialogOpen(false); }}
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
