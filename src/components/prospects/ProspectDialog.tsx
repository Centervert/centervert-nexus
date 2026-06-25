import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/contacts/AddressAutocomplete";

interface ProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prospect?: {
    id: string;
    name: string;
    category: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    status: string;
    notes: string | null;
  } | null;
}

const CATEGORIES = ["Restaurant", "Retail", "Office", "Medical", "Service", "Other"];
const STATUSES: Array<{ value: string; label: string }> = [
  { value: "new", label: "New" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
  { value: "do_not_contact", label: "Do Not Contact" },
  { value: "converted", label: "Converted" },
];

export function ProspectDialog({ open, onOpenChange, onSuccess, prospect }: ProspectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<string>("new");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(prospect?.name ?? "");
      setCategory(prospect?.category ?? "");
      setPhone(prospect?.phone ?? "");
      setWebsite(prospect?.website ?? "");
      setAddress(prospect?.address ?? "");
      setStatus(prospect?.status ?? "new");
      setNotes(prospect?.notes ?? "");
    }
  }, [open, prospect]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      name: name.trim(),
      category: category || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      status,
      notes: notes || null,
    };
    let error;
    if (prospect?.id) {
      ({ error } = await supabase.from("prospects").update(payload).eq("id", prospect.id));
    } else {
      ({ error } = await supabase.from("prospects").insert({
        ...payload,
        owner_id: user.id,
        created_by: user.id,
      }));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: prospect ? "Prospect updated" : "Prospect added" });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{prospect ? "Edit Prospect" : "Add Prospect"}</SheetTitle>
          <SheetDescription>
            Track a business you've canvassed or plan to visit.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Business Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Joe's Diner" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <AddressAutocomplete value={address} onChange={setAddress} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : prospect ? "Save" : "Add Prospect"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}