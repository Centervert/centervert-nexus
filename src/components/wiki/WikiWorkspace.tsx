import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Search, BookOpen } from "lucide-react";
import { WikiPageTree } from "./WikiPageTree";
import { WikiPageEditor } from "./WikiPageEditor";
import { buildWikiTree, PAGE_TEMPLATES, templateBody, type WikiPageRow } from "@/lib/wiki";
import { useAuth } from "@/contexts/AuthContext";

interface WikiWorkspaceProps {
  projectId?: string | null;
  canEdit: boolean;
  emptyLabel?: string;
}

export function WikiWorkspace({ projectId = null, canEdit, emptyLabel }: WikiWorkspaceProps) {
  const { user } = useAuth();
  const [pages, setPages] = useState<WikiPageRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTemplate, setNewTemplate] = useState("blank");
  const [newParentId, setNewParentId] = useState<string | null>(null);

  const loadPages = async () => {
    let query = supabase.from("wiki_pages").select("*");
    query = projectId ? query.eq("project_id", projectId) : query.is("project_id", null);
    const { data, error } = await query.order("position", { ascending: true });
    if (error) {
      toast.error("Failed to load wiki pages");
      setLoading(false);
      return;
    }
    const rows = (data || []) as WikiPageRow[];
    setPages(rows);
    setSelectedId((current) => (current && rows.some((r) => r.id === current) ? current : rows[0]?.id ?? null));

    const ids = Array.from(
      new Set(rows.flatMap((r) => [r.updated_by, r.created_by]).filter(Boolean) as string[])
    );
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((p) => {
        map[p.id] = p.full_name || p.email;
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    const matches = pages.filter(
      (p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
    );
    // Keep ancestors so the tree stays navigable
    const byId = new Map(pages.map((p) => [p.id, p]));
    const keep = new Set<string>();
    matches.forEach((m) => {
      let cur: WikiPageRow | undefined = m;
      while (cur) {
        keep.add(cur.id);
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
      }
    });
    return pages.filter((p) => keep.has(p.id));
  }, [pages, search]);

  const tree = useMemo(() => buildWikiTree(filtered), [filtered]);
  const selected = pages.find((p) => p.id === selectedId) || null;

  const openCreate = (parentId: string | null) => {
    setNewParentId(parentId);
    setNewTitle("");
    setNewTemplate("blank");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      toast.error("Give the page a title");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("wiki_pages")
      .insert({
        project_id: projectId,
        parent_id: newParentId,
        title,
        body: templateBody(newTemplate, title),
        page_type: newTemplate,
        position: pages.filter((p) => p.parent_id === newParentId).length,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("Failed to create page");
      return;
    }
    setCreateOpen(false);
    await loadPages();
    setSelectedId(data.id);
    toast.success("Page created");
  };

  const handleSave = async (values: { title: string; body: string }) => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("wiki_pages")
      .update({ ...values, updated_by: user?.id ?? null })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save page");
      return;
    }
    await loadPages();
    toast.success("Page saved");
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.title}" and its sub-pages?`)) return;
    const { error } = await supabase.from("wiki_pages").delete().eq("id", selected.id);
    if (error) {
      toast.error("Failed to delete page");
      return;
    }
    setSelectedId(null);
    await loadPages();
    toast.success("Page deleted");
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages"
            className="pl-8 h-9"
          />
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" className="w-full" onClick={() => openCreate(null)}>
            <Plus className="h-4 w-4 mr-2" />
            New page
          </Button>
        )}
        <Card>
          <CardContent className="p-2">
            {tree.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No pages yet.</p>
            ) : (
              <WikiPageTree
                nodes={tree}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAddChild={openCreate}
                canEdit={canEdit}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {selected ? (
            <WikiPageEditor
              page={selected}
              editorName={selected.updated_by ? profiles[selected.updated_by] : null}
              canEdit={canEdit}
              saving={saving}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{emptyLabel || "Create a page to start documenting."}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newParentId ? "New sub-page" : "New page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Weekly standup notes"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select value={newTemplate} onValueChange={setNewTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
