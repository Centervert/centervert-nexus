import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { File, Image, Download, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatAttachmentProps {
  attachment: {
    id: string;
    name: string;
    attachment_type: string;
    storage_path: string | null;
    url: string | null;
  };
  onRemove?: () => void;
  showRemove?: boolean;
}

export function ChatAttachment({ attachment, onRemove, showRemove }: ChatAttachmentProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (attachment.storage_path) {
      loadSignedUrl();
      checkIfImage();
    }
  }, [attachment.storage_path]);

  const checkIfImage = () => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const ext = attachment.name.toLowerCase().slice(attachment.name.lastIndexOf("."));
    setIsImage(imageExtensions.includes(ext));
  };

  const loadSignedUrl = async () => {
    if (!attachment.storage_path) return;
    
    const { data } = await supabase.storage
      .from("deal-attachments")
      .createSignedUrl(attachment.storage_path, 3600);

    if (data?.signedUrl) {
      setSignedUrl(data.signedUrl);
    }
  };

  const handleDownload = () => {
    if (attachment.url) {
      window.open(attachment.url, "_blank");
    } else if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  // External link
  if (attachment.attachment_type === "link" && attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors max-w-xs"
      >
        <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-sm truncate">{attachment.name}</span>
      </a>
    );
  }

  // Image attachment
  if (isImage && signedUrl) {
    return (
      <div className="relative inline-block max-w-xs group">
        {showRemove && onRemove && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <a href={signedUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={signedUrl}
            alt={attachment.name}
            className="rounded-lg max-h-48 object-cover border hover:opacity-90 transition-opacity"
          />
        </a>
      </div>
    );
  }

  // File attachment
  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg max-w-xs group">
      {showRemove && onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <File className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">{attachment.name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleDownload}
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface PendingAttachmentProps {
  file: File;
  onRemove: () => void;
}

export function PendingAttachment({ file, onRemove }: PendingAttachmentProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  if (isImage && preview) {
    return (
      <div className="relative inline-block group">
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
        <img
          src={preview}
          alt={file.name}
          className="rounded-lg max-h-20 object-cover border"
        />
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg max-w-xs group">
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
      <File className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate">{file.name}</span>
    </div>
  );
}
