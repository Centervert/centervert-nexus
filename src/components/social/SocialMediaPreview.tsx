import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  path: string;
  onRemove?: () => void;
}

const isImage = (path: string) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(path);
const isVideo = (path: string) => /\.(mp4|mov|webm|m4v)$/i.test(path);

export function SocialMediaPreview({ path, onRemove }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.storage
      .from("social-media")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [path]);

  const name = path.split("/").pop();

  return (
    <div className="relative group rounded-md border overflow-hidden bg-muted/30">
      {isImage(path) && url ? (
        <img src={url} alt={name} className="h-28 w-full object-cover" loading="lazy" />
      ) : isVideo(path) && url ? (
        <video src={url} className="h-28 w-full object-cover" controls />
      ) : (
        <a
          href={url ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="flex h-28 flex-col items-center justify-center gap-2 p-2 text-xs text-muted-foreground"
        >
          <FileText className="h-6 w-6" />
          <span className="line-clamp-2 break-all text-center">{name}</span>
        </a>
      )}
      {onRemove && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
