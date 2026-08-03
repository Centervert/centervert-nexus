import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "checkbox" | "number";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export interface RecordListProps {
  dealId: string;
  table: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  /** Field rendered as the row heading. */
  primaryField: string;
  /** Fields rendered as the row subtitle. */
  metaFields?: string[];
  orderBy?: string;
  onChanged?: () => void;
}

type Row = Record<string, any>;

export function RecordList({
  dealId,
  table,
  title,
  description,
  fields,
  primaryField,
  metaFields = [],
  orderBy = "created_at",
  onChanged,
}: RecordListProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from(table as any) as any)
      .select("*")
      .eq("deal_id", dealId)
      .order(orderBy, { ascending: true });
    if (error) toast({ title: `Could not load ${title}`, description: error.message, variant: "destructive" });
    setRows((data || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, table]);

  const startAdd = () => {
    const initial: Row = {};
    for (const f of fields) {
      if (f.type === "checkbox") initial[f.name] = false;
      else if (f.type === "select") initial[f.name] = f.options?.[0]?.value ?? "";
      else initial[f.name] = "";
    }
    setForm(initial);
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (row: Row) => {
    const initial: Row = {};
    for (const f of fields) initial[f.name] = row[f.name] ?? (f.type === "checkbox" ? false : "");
    setForm(initial);
    setEditing(row);
    setOpen(true);
  };

  const save = async () => {
    const payload: Row = { ...form };
    for (const f of fields) {
      if (payload[f.name] === "") payload[f.name] = null;
      if (f.type === "number" && payload[f.name] != null) payload[f.name] = Number(payload[f.name]);
    }
    const required = fields.find((f) => f.required && !payload[f.name]);
    if (required) {
      toast({ title: `${required.label} is required`, variant: "destructive" });
      return;
    }

    let error;
    if (editing) {
      ({ error } = await (supabase.from(table as any) as any).update(payload).eq("id", editing.id));
    } else {
      const { data: userData } = await supabase.auth.getUser();
      ({ error } = await (supabase.from(table as any) as any).insert({
        ...payload,
        deal_id: dealId,
        created_by: userData.user?.id ?? null,
      }));
    }
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false);
    await load();
    onChanged?.();
  };

  const remove = async () => {
    if (!editing) return;
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", editing.id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false);
    await load();
    onChanged?.();
  };

  const metaText = (row: Row) =>
    metaFields
      .map((name) => {
        const f = fields.find((x) => x.name === name);
        const value = row[name];
        if (value === null || value === undefined || value === "") return null;
        if (f?.type === "checkbox") return value ? f.label : null;
        if (f?.type === "select") return f.options?.find((o) => o.value === value)?.label ?? value;
        return value;
      })
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Button size="sm" variant="outline" onClick={startAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
      ) : (
        <div className="divide-y rounded-md border">
          {rows.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-3 p-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{row[primaryField]}</p>
                {metaText(row) && <p className="text-xs text-muted-foreground">{metaText(row)}</p>}
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => startEdit(row)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} — {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                {f.type === "checkbox" ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={f.name}
                      checked={!!form[f.name]}
                      onCheckedChange={(v) => setForm({ ...form, [f.name]: !!v })}
                    />
                    <Label htmlFor={f.name}>{f.label}</Label>
                  </div>
                ) : (
                  <>
                    <Label htmlFor={f.name}>{f.label}</Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        id={f.name}
                        rows={2}
                        value={form[f.name] ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      />
                    ) : f.type === "select" ? (
                      <Select
                        value={form[f.name] || undefined}
                        onValueChange={(v) => setForm({ ...form, [f.name]: v })}
                      >
                        <SelectTrigger id={f.name}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {f.options?.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={f.name}
                        type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                        value={form[f.name] ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {editing ? (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={remove}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}