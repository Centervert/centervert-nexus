import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import {
  SECRET_ENVIRONMENTS,
  SECRET_MANAGERS,
  labelFor,
  looksLikeSecretValue,
} from "@/lib/wiki";

interface SecretRef {
  id: string;
  project_id: string;
  name: string;
  manager: string;
  location_path: string | null;
  environment: string;
  owner_id: string | null;
  rotation_notes: string | null;
  last_rotated_on: string | null;
}

interface SecretsRegisterProps {
  projectId: string;
  canEdit: boolean;
}

const emptyForm = {
  name: "",
  manager: "doppler",
  location_path: "",
  environment: "all",
  owner_id: "",
  rotation_notes: "",
  last_rotated_on: "",
};

export function SecretsRegister({ projectId, canEdit }: SecretsRegisterProps) {
  const [refs, setRefs] = useState<SecretRef[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("project_secret_refs")
      .select("*")
      .eq("project_id", projectId)
      .order("name", { ascending: true });
    if (!error) setRefs((data || []) as SecretRef[]);

    const { data: profs } = await supabase.from("profiles").select("id, full_name, email");
    setPeople((profs || []).map((p) => ({ id: p.id, name: p.full_name || p.email })));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (r: SecretRef) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      manager: r.manager,
      location_path: r.location_path || "",
      environment: r.environment,
      owner_id: r.owner_id || "",
      rotation_notes: r.rotation_notes || "",
      last_rotated_on: r.last_rotated_on || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Secret name is required");
      return;
    }
    const guarded = [form.name, form.location_path, form.rotation_notes];
    if (guarded.some((v) => looksLikeSecretValue(v))) {
      toast.error("That looks like an actual secret value — store only where it lives, never the value.");
      return;
    }
    setSaving(true);
    const payload = {
      project_id: projectId,
      name: form.name.trim(),
      manager: form.manager,
      location_path: form.location_path.trim() || null,
      environment: form.environment,
      owner_id: form.owner_id || null,
      rotation_notes: form.rotation_notes.trim() || null,
      last_rotated_on: form.last_rotated_on || null,
    };
    const { error } = editingId
      ? await supabase.from("project_secret_refs").update(payload).eq("id", editingId)
      : await supabase.from("project_secret_refs").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Failed to save secret reference");
      return;
    }
    setOpen(false);
    load();
    toast.success(editingId ? "Reference updated" : "Reference added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("project_secret_refs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove reference");
      return;
    }
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Secrets Register</CardTitle>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Reference only — record where a secret lives and who owns it. Never paste values here.
          </p>
        </div>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {refs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No secret references recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Managed in</TableHead>
                  <TableHead>Location / path</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Last rotated</TableHead>
                  {canEdit && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {refs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{labelFor(SECRET_MANAGERS, r.manager)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.location_path || "—"}</TableCell>
                    <TableCell>{labelFor(SECRET_ENVIRONMENTS, r.environment)}</TableCell>
                    <TableCell>
                      {people.find((p) => p.id === r.owner_id)?.name || "—"}
                    </TableCell>
                    <TableCell>{r.last_rotated_on || "—"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit secret reference" : "Add secret reference"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. STRIPE_SECRET_KEY"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Managed in</label>
                <Select value={form.manager} onValueChange={(v) => setForm({ ...form, manager: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECRET_MANAGERS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Environment</label>
                <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECRET_ENVIRONMENTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location / path</label>
              <Input
                value={form.location_path}
                onChange={(e) => setForm({ ...form, location_path: e.target.value })}
                placeholder="e.g. doppler://centervert/portal/prod"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Owner</label>
                <Select
                  value={form.owner_id || "none"}
                  onValueChange={(v) => setForm({ ...form, owner_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last rotated</label>
                <Input
                  type="date"
                  value={form.last_rotated_on}
                  onChange={(e) => setForm({ ...form, last_rotated_on: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rotation notes</label>
              <Textarea
                value={form.rotation_notes}
                onChange={(e) => setForm({ ...form, rotation_notes: e.target.value })}
                placeholder="How and how often it's rotated, who to ask for access"
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
