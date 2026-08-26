import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { SOCIAL_PLATFORMS, SOCIAL_STATUSES, SocialPost } from "@/lib/social";
import { SocialMediaPreview } from "./SocialMediaPreview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: SocialPost | null;
  defaultDate?: string;
  canEdit: boolean;
  onSaved: () => void;
}

const emptyForm = (date: string) => ({
  title: "",
  copy: "",
  platforms: [] as string[],
  media_urls: [] as string[],
  scheduled_date: date,
  scheduled_time: "",
  status: "draft",
  organization_id: "",
  notes: "",
});

export function SocialPostSheet({ open, onOpenChange, post, defaultDate, canEdit, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm(defaultDate ?? ""));
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (post) {
      setForm({
        title: post.title,
        copy: post.copy ?? "",
        platforms: post.platforms ?? [],
        media_urls: post.media_urls ?? [],
        scheduled_date: post.scheduled_date,
        scheduled_time: post.scheduled_time ? post.scheduled_time.slice(0, 5) : "",
        status: post.status,
        organization_id: post.organization_id ?? "",
        notes: post.notes ?? "",
      });
    } else {
      setForm(emptyForm(defaultDate ?? ""));
    }
  }, [open, post, defaultDate]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("organizations")
      .select("id, name")
      .order("name")
      .then(({ data }) => setOrganizations(data ?? []));
  }, [open]);

  const togglePlatform = (value: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(value)
        ? f.platforms.filter((p) => p !== value)
        : [...f.platforms, value],
    }));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${form.scheduled_date || "unscheduled"}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("social-media").upload(path, file);
        if (error) throw error;
        uploaded.push(path);
      }
      setForm((f) => ({ ...f, media_urls: [...f.media_urls, ...uploaded] }));
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.scheduled_date) {
      toast({ title: "Title and date are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      copy: form.copy || null,
      platforms: form.platforms,
      media_urls: form.media_urls,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time || null,
      status: form.status,
      organization_id: form.organization_id || null,
      notes: form.notes || null,
    };

    const { error } = post
      ? await supabase.from("social_posts").update(payload).eq("id", post.id)
      : await supabase.from("social_posts").insert({ ...payload, created_by: user?.id ?? null });

    setSaving(false);
    if (error) {
      toast({ title: "Could not save post", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: post ? "Post updated" : "Post created" });
    onSaved();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!post) return;
    setSaving(true);
    const { error } = await supabase.from("social_posts").delete().eq("id", post.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not delete post", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Post deleted" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{post ? "Edit post" : "New post"}</SheetTitle>
          <SheetDescription>
            Plan the copy, media and profiles for this post. Publishing is done manually.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="sp-title">Title</Label>
            <Input
              id="sp-title"
              value={form.title}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Fall promo — carousel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sp-date">Date</Label>
              <Input
                id="sp-date"
                type="date"
                value={form.scheduled_date}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-time">Time</Label>
              <Input
                id="sp-time"
                type="time"
                value={form.scheduled_time}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profiles</Label>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_PLATFORMS.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={form.platforms.includes(p.value)}
                    disabled={!canEdit}
                    onCheckedChange={() => togglePlatform(p.value)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sp-copy">Copy</Label>
              <span className="text-xs text-muted-foreground">{form.copy.length} characters</span>
            </div>
            <Textarea
              id="sp-copy"
              rows={6}
              value={form.copy}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, copy: e.target.value }))}
              placeholder="Caption, hashtags, links…"
            />
          </div>

          <div className="space-y-2">
            <Label>Media</Label>
            {form.media_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.media_urls.map((path) => (
                  <SocialMediaPreview
                    key={path}
                    path={path}
                    onRemove={
                      canEdit
                        ? () => setForm((f) => ({ ...f, media_urls: f.media_urls.filter((m) => m !== path) }))
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
            {canEdit && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload media
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                disabled={!canEdit}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Company (optional)</Label>
              <Select
                value={form.organization_id || "none"}
                disabled={!canEdit}
                onValueChange={(v) => setForm((f) => ({ ...f, organization_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-notes">Internal notes</Label>
            <Textarea
              id="sp-notes"
              rows={3}
              value={form.notes}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {canEdit && (
            <>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {post ? "Save changes" : "Create post"}
                </Button>
              </div>

              {post && (
                <>
                  <Separator />
                  <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={saving}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
