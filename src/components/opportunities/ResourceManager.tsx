import { useState, useRef, DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Link as LinkIcon, Upload, FileText, Trash2, ExternalLink, GripVertical, Pencil } from "lucide-react";
import { PdfViewerDialog, usePdfViewer } from "@/components/ui/pdf-viewer-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Resource {
  id: string;
  file_name: string;
  file_path: string;
  attachment_type: string;
  created_at: string;
  position?: number;
}

interface ResourceManagerProps {
  opportunityId: string;
  opportunityType: "private" | "government";
  resources: Resource[];
  onResourcesChange: () => void;
  disabled?: boolean;
}

interface SortableResourceItemProps {
  resource: Resource;
  disabled: boolean;
  onDelete: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onClick: (resource: Resource) => void;
  getIcon: (type: string) => React.ReactNode;
}

function SortableResourceItem({ resource, disabled, onDelete, onEdit, onClick, getIcon }: SortableResourceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={cn(isDragging && "shadow-lg")}>
      <CardContent className="p-4 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onClick(resource)}
          className="flex items-center gap-3 flex-1 text-left hover:text-primary transition-colors"
        >
          {getIcon(resource.attachment_type)}
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
          onClick={() => onEdit(resource)}
          disabled={disabled}
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(resource)}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function ResourceManager({
  opportunityId,
  opportunityType,
  resources,
  onResourcesChange,
  disabled = false,
}: ResourceManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [resourceType, setResourceType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // PDF Viewer
  const { pdfViewerOpen, setPdfViewerOpen, pdfUrl, pdfName, openPdf } = usePdfViewer();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort resources by position
  const sortedResources = [...resources].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const handleFileDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setDroppedFile(files[0]);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedResources.findIndex((r) => r.id === active.id);
      const newIndex = sortedResources.findIndex((r) => r.id === over.id);

      const reordered = arrayMove(sortedResources, oldIndex, newIndex);

      // Update positions in database
      const updates = reordered.map((resource, index) => ({
        id: resource.id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from("opportunity_attachments")
          .update({ position: update.position })
          .eq("id", update.id);
      }

      onResourcesChange();
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.error("You must be logged in");
        return;
      }

      // Get max position for new resource
      const maxPosition = Math.max(...sortedResources.map(r => r.position ?? 0), -1) + 1;

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
        position: maxPosition,
      });

      if (dbError) throw dbError;

      setShowAddDialog(false);
      setResourceType("");
      setDroppedFile(null);
      onResourcesChange();
    } catch (error: any) {
      console.error("Upload error:", error.message);
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
        console.error("You must be logged in");
        return;
      }

      const maxPosition = Math.max(...sortedResources.map(r => r.position ?? 0), -1) + 1;

      const { error } = await supabase.from("opportunity_attachments").insert({
        opportunity_id: opportunityId,
        file_name: linkName,
        file_path: linkUrl,
        attachment_type: "link",
        created_by: session.session.user.id,
        position: maxPosition,
      });

      if (error) throw error;

      setShowAddDialog(false);
      onResourcesChange();
    } catch (error: any) {
      console.error("Error adding link:", error.message);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = droppedFile || (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
    
    if (!file) {
      console.error("Please select a file");
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

      onResourcesChange();
    } catch (error: any) {
      console.error("Delete error:", error.message);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditName(resource.file_name);
    setEditUrl(resource.attachment_type === "link" ? resource.file_path : "");
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource || !editName.trim()) return;

    try {
      const updateData: { file_name: string; file_path?: string } = {
        file_name: editName.trim(),
      };

      // Only update file_path for links
      if (editingResource.attachment_type === "link" && editUrl.trim()) {
        updateData.file_path = editUrl.trim();
      }

      const { error } = await supabase
        .from("opportunity_attachments")
        .update(updateData)
        .eq("id", editingResource.id);

      if (error) throw error;

      setShowEditDialog(false);
      setEditingResource(null);
      onResourcesChange();
    } catch (error: any) {
      console.error("Edit error:", error.message);
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
      // Get signed URL for file
      const { data } = await supabase.storage
        .from("opportunity-attachments")
        .createSignedUrl(resource.file_path, 3600);

      if (data?.signedUrl) {
        // Check if it's a PDF - open in viewer
        const isPdf = resource.file_path.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          openPdf(data.signedUrl, resource.file_name);
        } else {
          window.open(data.signedUrl, "_blank");
        }
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

      {sortedResources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No resources added yet</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedResources.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-2">
              {sortedResources.map((resource) => (
                <SortableResourceItem
                  key={resource.id}
                  resource={resource}
                  disabled={disabled}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onClick={handleResourceClick}
                  getIcon={getResourceIcon}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
                    onDragOver={handleFileDragOver}
                    onDragLeave={handleFileDragLeave}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDraggingFile
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              {editingResource?.attachment_type === "link" 
                ? "Update the name and URL for this link" 
                : "Update the display name for this resource"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Name</Label>
              <Input
                id="edit_name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                placeholder="Resource name"
              />
            </div>
            {editingResource?.attachment_type === "link" && (
              <div>
                <Label htmlFor="edit_url">URL</Label>
                <Input
                  id="edit_url"
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  required
                  placeholder="https://example.com"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PdfViewerDialog
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={pdfUrl}
        fileName={pdfName}
      />
    </div>
  );
}
