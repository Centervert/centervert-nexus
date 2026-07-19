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
import { MailOpen, MessageCircle, DoorClosed } from "lucide-react";
import { cn } from "@/lib/utils";

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

const VISIT_OPTIONS = [
  { value: "card_only", label: "Card drop", hint: "Left a card, no contact", icon: MailOpen },
  { value: "yes", label: "Made contact", hint: "Spoke with someone", icon: MessageCircle },
  { value: "no", label: "No one there", hint: "Nobody available", icon: DoorClosed },
] as const;

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
  const [logVisit, setLogVisit] = useState(true);
  const [contactMade, setContactMade] = useState<string>("card_only");
  const [personSpokenTo, setPersonSpokenTo] = useState("");

  useEffect(() => {
    if (open) {
      setName(prospect?.name ?? "");
      setCategory(prospect?.category ?? "");
      setPhone(prospect?.phone ?? "");
      setWebsite(prospect?.website ?? "");
      setAddress(prospect?.address ?? "");
      setStatus(prospect?.status ?? "new");
      setNotes(prospect?.notes ?? "");
      setLogVisit(!prospect);
      setContactMade("card_only");
      setPersonSpokenTo("");
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
    let newProspectId: string | null = null;
    if (prospect?.id) {
      ({ error } = await supabase.from("prospects").update(payload).eq("id", prospect.id));
    } else {
      const { data, error: insertErr } = await supabase
        .from("prospects")
        .insert({ ...payload, owner_id: user.id, created_by: user.id })
        .select("id")
        .single();
      error = insertErr;
      newProspectId = data?.id ?? null;
    }
    if (error) {
      setSaving(false);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    if (!prospect && newProspectId && logVisit) {
      await supabase.from("prospect_visits").insert({
        prospect_id: newProspectId,
        rep_id: user.id,
        created_by: user.id,
        contact_made: contactMade as any,
        person_spoken_to: contactMade === "yes" ? (personSpokenTo || null) : null,
      });
    }
    setSaving(false);
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

          {!prospect && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <Label className="cursor-pointer" onClick={() => setLogVisit(!logVisit)}>
                  Log first visit
                </Label>
                <button
                  type="button"
                  onClick={() => setLogVisit(!logVisit)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {logVisit ? "Skip" : "Add"}
                </button>
              </div>
              {logVisit && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {VISIT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const selected = contactMade === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setContactMade(opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-md border p-2 text-center transition-colors",
                            selected
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-medium">{opt.label}</span>
                          <span className="text-[10px] leading-tight">{opt.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                  {contactMade === "yes" && (
                    <div className="space-y-2">
                      <Label>Who did you speak with?</Label>
                      <Input
                        value={personSpokenTo}
                        onChange={(e) => setPersonSpokenTo(e.target.value)}
                        placeholder="Name or role (e.g. manager)"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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