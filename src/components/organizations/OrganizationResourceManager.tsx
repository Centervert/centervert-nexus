import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FileText,
  Link as LinkIcon,
  Trash2,
  GripVertical,
  ExternalLink,
  Upload,
  File,
} from "lucide-react";
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
import { PdfViewerDialog, usePdfViewer } from "@/components/ui/pdf-viewer-dialog";

interface Resource {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  attachment_type: string | null;
  position: number;
}

interface OrganizationResourceManagerProps {
  organizationId: string;
  resources: Resource[];
  onResourcesChange: () => void;
}

interface SortableResourceItemProps {
  resource: Resource;
  onDelete: (id: string) => void;
  onClick: (resource: Resource) => void;
}

const DOCUMENT_TYPES = [
  { value: "nda", label: "NDA" },
  { value: "msa", label: "Master Service Agreement" },
  { value: "sow", label: "Statement of Work (SOW)" },
  { value: "contract", label: "Contract" },
  { value: "proposal", label: "Proposal" },
  { value: "invoice", label: "Invoice" },
  { value: "other", label: "Other Document" },
  { value: "link", label: "Link" },
];

function SortableResourceItem({ resource, onDelete, onClick }: SortableResourceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLink = resource.attachment_type === "link";
  const isPdf = resource.file_type?.includes("pdf");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-background border rounded-lg group hover:bg-muted/50"
    >
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <div
        className="flex-1 flex items-center gap-2 cursor-pointer"
        onClick={() => onClick(resource)}
      >
        {isLink ? (
          <LinkIcon className="h-4 w-4 text-primary" />
        ) : isPdf ? (
          <FileText className="h-4 w-4 text-red-500" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm truncate">{resource.file_name}</span>
        {resource.attachment_type && resource.attachment_type !== "link" && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            ({DOCUMENT_TYPES.find(t => t.value === resource.attachment_type)?.label || resource.attachment_type})
          </span>
        )}
        {isLink && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(resource.id);
        }}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
}

export default function OrganizationResourceManager({
  organizationId,
  resources,
  onResourcesChange,
}: OrganizationResourceManagerProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [resourceType, setResourceType] = useState<"file" | "link">("file");
  const [orderedResources, setOrderedResources] = useState<Resource[]>([]);

  const { pdfViewerOpen, setPdfViewerOpen, pdfUrl, pdfName, openPdf } = usePdfViewer();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const sorted = [...resources].sort((a, b) => (a.position || 0) - (b.position || 0));
    setOrderedResources(sorted);
  }, [resources]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedResources.findIndex((r) => r.id === active.id);
    const newIndex = orderedResources.findIndex((r) => r.id === over.id);
    const newOrder = arrayMove(orderedResources, oldIndex, newIndex);
    setOrderedResources(newOrder);

    // Update positions in database
    const updates = newOrder.map((resource, index) => ({
      id: resource.id,
      position: index,
    }));

    for (const update of updates) {
      await supabase
        .from("organization_attachments")
        .update({ position: update.position })
        .eq("id", update.id);
    }

    onResourcesChange();
  };

  const uploadFile = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Please select a file and document type");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${organizationId}/${Date.now()}-${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-attachments")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("organization_attachments")
        .insert({
          organization_id: organizationId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          attachment_type: documentType,
          position: orderedResources.length,
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
      setDialogOpen(false);
      resetForm();
      onResourcesChange();
    } catch (error: any) {
      toast.error("Failed to upload document", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl || !linkName) {
      toast.error("Please enter a name and URL");
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase.from("organization_attachments").insert({
        organization_id: organizationId,
        file_name: linkName,
        file_path: linkUrl,
        file_type: "link",
        attachment_type: "link",
        position: orderedResources.length,
      });

      if (error) throw error;

      toast.success("Link added successfully");
      setDialogOpen(false);
      resetForm();
      onResourcesChange();
    } catch (error: any) {
      toast.error("Failed to add link", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    const resource = orderedResources.find((r) => r.id === resourceId);
    if (!resource) return;

    try {
      // Delete from storage if it's a file
      if (resource.attachment_type !== "link") {
        await supabase.storage
          .from("organization-attachments")
          .remove([resource.file_path]);
      }

      const { error } = await supabase
        .from("organization_attachments")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      toast.success("Resource deleted");
      onResourcesChange();
    } catch (error: any) {
      toast.error("Failed to delete resource", { description: error.message });
    }
  };

  const handleResourceClick = async (resource: Resource) => {
    if (resource.attachment_type === "link") {
      window.open(resource.file_path, "_blank");
      return;
    }

    // Check if it's a PDF
    if (resource.file_type?.includes("pdf")) {
      const { data } = await supabase.storage
        .from("organization-attachments")
        .createSignedUrl(resource.file_path, 3600);

      if (data?.signedUrl) {
        openPdf(data.signedUrl, resource.file_name);
      }
      return;
    }

    // For other files, download
    const { data } = await supabase.storage
      .from("organization-attachments")
      .createSignedUrl(resource.file_path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setLinkUrl("");
    setLinkName("");
    setDocumentType("");
    setResourceType("file");
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Resources</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {orderedResources.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No resources yet
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedResources.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {orderedResources.map((resource) => (
                  <SortableResourceItem
                    key={resource.id}
                    resource={resource}
                    onDelete={handleDelete}
                    onClick={handleResourceClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={resourceType === "file" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("file")}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload File
              </Button>
              <Button
                variant={resourceType === "link" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("link")}
                className="flex-1"
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>

            {resourceType === "file" ? (
              <>
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.filter(t => t.value !== "link").map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>File</Label>
                  <Input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <Button
                  onClick={uploadFile}
                  disabled={!selectedFile || !documentType || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Upload Document"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Link Name</Label>
                  <Input
                    placeholder="e.g., Company Website"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleAddLink}
                  disabled={!linkUrl || !linkName || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Adding..." : "Add Link"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PdfViewerDialog
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={pdfUrl}
        fileName={pdfName}
      />
    </>
  );
}
