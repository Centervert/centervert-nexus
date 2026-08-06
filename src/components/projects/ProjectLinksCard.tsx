import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { LINK_CATEGORIES, linkCategory } from "@/lib/wiki";

interface ProjectLink {
  id: string;
  project_id: string;
  label: string;
  url: string;
  category: string;
  note: string | null;
  position: number;
}

interface ProjectLinksCardProps {
  projectId: string;
  canEdit: boolean;
}

const emptyForm = { label: "", url: "", category: "code", note: "" };

export function ProjectLinksCard({ projectId, canEdit }: ProjectLinksCardProps) {
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("project_links")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });
    if (!error) setLinks((data || []) as ProjectLink[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ProjectLink[]>();
    links.forEach((l) => {
      const list = map.get(l.category) || [];
      list.push(l);
      map.set(l.category, list);
    });
    return LINK_CATEGORIES.filter((c) => map.has(c.value)).map((c) => ({
      category: c,
      items: map.get(c.value)!,
    }));
  }, [links]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (link: ProjectLink) => {
    setEditingId(link.id);
    setForm({ label: link.label, url: link.url, category: link.category, note: link.note || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.label.trim() || !form.url.trim()) {
      toast.error("Label and URL are required");
      return;
    }
    setSaving(true);
    const payload = {
      project_id: projectId,
      label: form.label.trim(),
      url: form.url.trim(),
      category: form.category,
      note: form.note.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("project_links").update(payload).eq("id", editingId)
      : await supabase.from("project_links").insert({ ...payload, position: links.length });
    setSaving(false);
    if (error) {
      toast.error("Failed to save link");
      return;
    }
    setOpen(false);
    load();
    toast.success(editingId ? "Link updated" : "Link added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("project_links").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove link");
      return;
    }
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Quick Links</CardTitle>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No links yet — add the repo, Linear project, designs or environments.
          </p>
        ) : (
          grouped.map(({ category, items }) => {
            const Icon = category.icon;
            return (
              <div key={category.value} className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {category.label}
                </div>
                <ul className="space-y-1">
                  {items.map((link) => (
                    <li key={link.id} className="group flex items-center gap-2 text-sm">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline truncate"
                        title={link.note || link.url}
                      >
                        <span className="truncate">{link.label}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      {canEdit && (
                        <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(link)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(link.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit link" : "Add link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Label</label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. GitHub repo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="What this link is for"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
