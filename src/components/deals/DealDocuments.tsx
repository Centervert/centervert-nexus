import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  File, 
  Link as LinkIcon, 
  Download, 
  ExternalLink, 
  MoreVertical,
  Trash2,
  Upload
} from "lucide-react";
import { format } from "date-fns";

interface Attachment {
  id: string;
  name: string;
  attachment_type: string;
  url: string | null;
  storage_path: string | null;
  uploaded_by: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface DealDocumentsProps {
  dealId: string;
}

export function DealDocuments({ dealId }: DealDocumentsProps) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadAttachments();
  }, [dealId]);

  const loadAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deal_attachments")
      .select("*, profiles:uploaded_by(full_name, email)")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading documents",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAttachments(data as Attachment[]);
    }
    setLoading(false);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    for (const file of Array.from(files)) {
      const filePath = `deals/${dealId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("deal-attachments")
        .upload(filePath, file);

      if (uploadError) {
        // Storage bucket might not exist, create attachment without storage
        toast({
          title: "Upload failed",
          description: "File storage is not configured. Please contact admin.",
          variant: "destructive",
        });
        continue;
      }

      const { error: dbError } = await supabase.from("deal_attachments").insert({
        deal_id: dealId,
        name: file.name,
        attachment_type: "file",
        storage_path: filePath,
        uploaded_by: userData.user.id,
      });

      if (dbError) {
        toast({
          title: "Error saving file",
          description: dbError.message,
          variant: "destructive",
        });
      }
    }

    setUploading(false);
    loadAttachments();
    toast({ title: "Files uploaded successfully" });
  };

  const handleAddLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase.from("deal_attachments").insert({
      deal_id: dealId,
      name: linkName.trim(),
      attachment_type: "link",
      url: linkUrl.trim(),
      uploaded_by: userData.user.id,
    });

    if (error) {
      toast({
        title: "Error adding link",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setLinkDialogOpen(false);
      setLinkName("");
      setLinkUrl("");
      loadAttachments();
      toast({ title: "Link added successfully" });
    }
  };

  const handleDelete = async (id: string, storagePath: string | null) => {
    if (storagePath) {
      await supabase.storage.from("deal-attachments").remove([storagePath]);
    }

    const { error } = await supabase.from("deal_attachments").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
    } else {
      loadAttachments();
      toast({ title: "Deleted successfully" });
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    if (attachment.attachment_type === "link" && attachment.url) {
      window.open(attachment.url, "_blank");
      return;
    }

    if (attachment.storage_path) {
      const { data } = await supabase.storage
        .from("deal-attachments")
        .createSignedUrl(attachment.storage_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [dealId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading documents...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files here, or
        </p>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                handleFileUpload(files);
              };
              input.click();
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Upload File
          </Button>

          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <LinkIcon className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Link</DialogTitle>
                <DialogDescription>
                  Add a link to an external resource.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="e.g., Google Drive Folder"
                  />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <Button onClick={handleAddLink} className="w-full">
                  Add Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Attachments list */}
      {attachments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No documents yet. Upload files or add links above.
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {attachment.attachment_type === "link" ? (
                  <LinkIcon className="h-5 w-5 text-blue-500 shrink-0" />
                ) : (
                  <File className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.profiles?.full_name || attachment.profiles?.email} •{" "}
                    {format(new Date(attachment.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(attachment)}>
                    {attachment.attachment_type === "link" ? (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(attachment.id, attachment.storage_path)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
