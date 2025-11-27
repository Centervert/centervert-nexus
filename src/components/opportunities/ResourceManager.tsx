import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Link as LinkIcon, Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Resource {
  id: string;
  file_name: string;
  file_path: string;
  attachment_type: string;
  created_at: string;
}

interface ResourceManagerProps {
  opportunityId: string;
  opportunityType: "private" | "government";
  resources: Resource[];
  onResourcesChange: () => void;
  disabled?: boolean;
}

export function ResourceManager({
  opportunityId,
  opportunityType,
  resources,
  onResourcesChange,
  disabled = false,
}: ResourceManagerProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [resourceType, setResourceType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Resource type options based on opportunity type
  const resourceTypes =
    opportunityType === "government"
      ? [
          { value: "link", label: "Link" },
          { value: "rfp", label: "RFP Document" },
          { value: "supporting_doc", label: "Supporting Document" },
          { value: "other", label: "Other File" },
        ]
      : [
          { value: "link", label: "Link" },
          { value: "file", label: "File" },
        ];

  const handleAddLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const linkUrl = formData.get("link_url") as string;
    const linkName = formData.get("link_name") as string;

    if (!linkUrl || !linkName) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("opportunity_attachments").insert({
        opportunity_id: opportunityId,
        file_name: linkName,
        file_path: linkUrl,
        attachment_type: "link",
        created_by: session.session.user.id,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Link added successfully" });
      setShowAddDialog(false);
      onResourcesChange();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const file = formData.get("file") as File;

      if (!file) {
        toast({ title: "Error", description: "Please select a file", variant: "destructive" });
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${opportunityId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("opportunity-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase.from("opportunity_attachments").insert({
        opportunity_id: opportunityId,
        file_name: file.name,
        file_path: fileName,
        file_type: file.type,
        attachment_type: resourceType,
        created_by: session.session.user.id,
      });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "File uploaded successfully" });
      setShowAddDialog(false);
      setResourceType("");
      onResourcesChange();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    try {
      // Delete from storage if it's a file
      if (resource.attachment_type !== "link") {
        const { error: storageError } = await supabase.storage
          .from("opportunity-attachments")
          .remove([resource.file_path]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("opportunity_attachments")
        .delete()
        .eq("id", resource.id);

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Resource deleted successfully" });
      onResourcesChange();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "rfp":
      case "supporting_doc":
        return <FileText className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const handleResourceClick = async (resource: Resource) => {
    if (resource.attachment_type === "link") {
      window.open(resource.file_path, "_blank");
    } else {
      // Get signed URL for file download
      const { data } = await supabase.storage
        .from("opportunity-attachments")
        .createSignedUrl(resource.file_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Resources</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Resource
        </Button>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No resources added yet</p>
      ) : (
        <div className="grid gap-2">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <button
                  onClick={() => handleResourceClick(resource)}
                  className="flex items-center gap-3 flex-1 text-left hover:text-primary transition-colors"
                >
                  {getResourceIcon(resource.attachment_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{resource.file_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {resource.attachment_type.replace("_", " ")}
                    </p>
                  </div>
                  {resource.attachment_type === "link" && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(resource)}
                  disabled={disabled}
                  className="ml-2"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>Choose the type of resource to add</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Resource Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {resourceType === "link" && (
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <Label htmlFor="link_name">Link Name</Label>
                  <Input id="link_name" name="link_name" required placeholder="e.g., Project Website" />
                </div>
                <div>
                  <Label htmlFor="link_url">URL</Label>
                  <Input
                    id="link_url"
                    name="link_url"
                    type="url"
                    required
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Link
                  </Button>
                </div>
              </form>
            )}

            {resourceType && resourceType !== "link" && (
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file">
                    {resourceType === "rfp"
                      ? "Upload RFP Document"
                      : resourceType === "supporting_doc"
                      ? "Upload Supporting Document"
                      : "Upload File"}
                  </Label>
                  <Input id="file" name="file" type="file" required />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading} className="flex-1">
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
