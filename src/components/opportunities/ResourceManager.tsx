import { useState, useRef, DragEvent } from "react";
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
import { cn } from "@/lib/utils";

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
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setDroppedFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
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
      setDroppedFile(null);
      onResourcesChange();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

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
    const file = droppedFile || (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
    
    if (!file) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" });
      return;
    }
    
    await uploadFile(file);
  };

  const clearDroppedFile = () => {
    setDroppedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
                  <Label>
                    {resourceType === "rfp"
                      ? "Upload RFP Document"
                      : resourceType === "supporting_doc"
                      ? "Upload Supporting Document"
                      : "Upload File"}
                  </Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                      droppedFile && "border-primary bg-primary/5"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setDroppedFile(e.target.files[0]);
                        }
                      }}
                    />
                    {droppedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{droppedFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearDroppedFile();
                          }}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag and drop a file here, or click to browse
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      clearDroppedFile();
                    }}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading || !droppedFile} className="flex-1">
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
