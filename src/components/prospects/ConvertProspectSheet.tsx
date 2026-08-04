import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemperatureSlider } from "@/components/deals/TemperatureSlider";
import { cn } from "@/lib/utils";
import { Building2, User, X, ArrowRight } from "lucide-react";

type Mode = "existing" | "new" | "skip";

interface Prospect {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  category: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect;
  suggestedContactName?: string | null;
  onConverted?: () => void;
}

function ModeTabs({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const opts: Array<{ v: Mode; label: string }> = [
    { v: "existing", label: "Use existing" },
    { v: "new", label: "Create new" },
    { v: "skip", label: "Skip" },
  ];
  return (
    <div className="inline-flex rounded-md border p-0.5 bg-muted/30">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
            value === o.v
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ConvertProspectSheet({ open, onOpenChange, prospect, suggestedContactName, onConverted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Deal basics
  const [dealName, setDealName] = useState("");
  const [temperature, setTemperature] = useState(5);
  const [expectedValue, setExpectedValue] = useState("");

  // Org section
  const [orgMode, setOrgMode] = useState<Mode>("new");
  const [existingOrgId, setExistingOrgId] = useState<string>("");
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgType, setOrgType] = useState("Private Company");

  // Contact section
  const [contactMode, setContactMode] = useState<Mode>("skip");
  const [existingContactId, setExistingContactId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!open) return;
    setDealName(prospect.name);
    setTemperature(5);
    setExpectedValue("");
    setOrgMode("new");
    setExistingOrgId("");
    setOrgName(prospect.name);
    setOrgAddress(prospect.address ?? "");
    setOrgPhone(prospect.phone ?? "");
    setOrgWebsite(prospect.website ?? "");
    setOrgType("Private Company");
    setContactMode(suggestedContactName ? "new" : "skip");
    setExistingContactId("");
    // Try to split suggested name into first/last
    if (suggestedContactName) {
      const parts = suggestedContactName.trim().split(/\s+/);
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
    } else {
      setFirstName("");
      setLastName("");
    }
    setEmail("");
    setContactPhone("");
    setTitle("");
  }, [open, prospect, suggestedContactName]);

  const { data: orgs } = useQuery({
    queryKey: ["convert-orgs"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: open,
  });

  const { data: contacts } = useQuery({
    queryKey: ["convert-contacts"],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("id, first_name, last_name, organization_id").order("first_name");
      return data ?? [];
    },
    enabled: open,
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (orgMode === "existing" && existingOrgId) {
      return contacts.filter((c: any) => c.organization_id === existingOrgId);
    }
    return contacts;
  }, [contacts, orgMode, existingOrgId]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!dealName.trim()) {
      toast({ title: "Deal name required", variant: "destructive" });
      return;
    }
    if (orgMode === "existing" && !existingOrgId) {
      toast({ title: "Pick an organization or switch to Create new / Skip", variant: "destructive" });
      return;
    }
    if (orgMode === "new" && !orgName.trim()) {
      toast({ title: "Organization name required", variant: "destructive" });
      return;
    }
    if (contactMode === "existing" && !existingContactId) {
      toast({ title: "Pick a contact or switch to Create new / Skip", variant: "destructive" });
      return;
    }
    if (contactMode === "new") {
      if (!firstName.trim() || !lastName.trim()) {
        toast({ title: "Contact first and last name required", variant: "destructive" });
        return;
      }
      if (!email.trim()) {
        toast({ title: "Contact email required", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Resolve organization
      let orgId: string | null = null;
      if (orgMode === "existing") {
        orgId = existingOrgId;
      } else if (orgMode === "new") {
        const { data, error } = await supabase
          .from("organizations")
          .insert({
            name: orgName.trim(),
            address: orgAddress || null,
            phone: orgPhone || null,
            website: orgWebsite || null,
            organization_type: orgType,
            notes: prospect.notes || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        orgId = data.id;
      }

      // 2. Resolve contact
      let contactId: string | null = null;
      if (contactMode === "existing") {
        contactId = existingContactId;
      } else if (contactMode === "new") {
        const { data, error } = await supabase
          .from("contacts")
          .insert({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            phone: contactPhone || null,
            title: title || null,
            organization_id: orgId,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        contactId = data.id;
      }

      // 3. Create deal
      const { data: deal, error: dealErr } = await supabase
        .from("deals")
        .insert({
          name: dealName.trim(),
          owner_id: user.id,
          created_by: user.id,
          temperature,
          stage: "discovery" as any,
          organization_id: orgId,
          contact_id: contactId,
          prospect_id: prospect.id,
          expected_value: expectedValue ? parseFloat(expectedValue) : null,
          description: [prospect.category, prospect.address, prospect.notes].filter(Boolean).join("\n") || null,
        })
        .select("id")
        .single();
      if (dealErr) throw dealErr;

      // 4. Seed MEDDPICC state from the prospecting checklist so the deal does
      //    not start from zero evidence.
      const { data: p } = await supabase
        .from("prospects")
        .select("has_possible_problem, spoke_with_relevant_person, discovery_scheduled, interest_level, notes")
        .eq("id", prospect.id)
        .maybeSingle();

      if (deal?.id) {
        const elements: Array<{ element: string; score: number; summary: string | null }> = [];
        if (p?.has_possible_problem) {
          elements.push({
            element: "pain",
            score: 1,
            summary: "Possible problem identified during prospecting — needs buyer validation.",
          });
        }
        if (p?.spoke_with_relevant_person) {
          elements.push({
            element: "economic_buyer",
            score: 1,
            summary: "Spoke with a relevant person during prospecting — authority not yet confirmed.",
          });
        }
        if (p?.discovery_scheduled) {
          elements.push({
            element: "decision_process",
            score: 1,
            summary: "Discovery scheduled during prospecting.",
          });
        }
        if (elements.length > 0) {
          await supabase.from("deal_elements").insert(
            elements.map((e) => ({
              deal_id: deal.id,
              ...e,
              last_verified_at: new Date().toISOString(),
              updated_by: user.id,
            })) as any,
          );
          await supabase.from("deal_evidence").insert(
            elements.map((e) => ({
              deal_id: deal.id,
              element: e.element,
              note: e.summary,
              source: "Prospecting checklist",
              created_by: user.id,
            })) as any,
          );
        }
        if (p?.has_possible_problem) {
          await supabase.from("deal_pains").insert({
            deal_id: deal.id,
            description: p?.notes?.trim() || "Problem surfaced during prospecting — details to confirm.",
            level: "operational",
            buyer_owned: false,
            created_by: user.id,
          } as any);
        }
      }

      // 5. Mark prospect converted and keep the link back to the deal
      await supabase
        .from("prospects")
        .update({
          status: "converted" as any,
          stage: "converted" as any,
          converted_deal_id: deal?.id ?? null,
          organization_id: orgId,
          primary_contact_id: contactId,
        } as any)
        .eq("id", prospect.id);

      toast({ title: "Converted to Deal", description: "Now in the deal pipeline." });
      onOpenChange(false);
      onConverted?.();
      if (deal?.id) navigate(`/deals/${deal.id}`);
    } catch (err: any) {
      toast({ title: "Convert failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Convert to Deal</SheetTitle>
          <SheetDescription>
            Turn <span className="font-medium">{prospect.name}</span> into an active deal.
            Attach an organization and contact — or skip and add them later.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Deal basics */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" /> Deal
            </h3>
            <div className="space-y-2">
              <Label>Deal name *</Label>
              <Input value={dealName} onChange={(e) => setDealName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Temperature</Label>
              <TemperatureSlider value={temperature} onChange={setTemperature} />
            </div>
            <div className="space-y-2">
              <Label>Expected value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  className="pl-7"
                  placeholder="0.00"
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Organization */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Organization
              </h3>
              <ModeTabs value={orgMode} onChange={setOrgMode} />
            </div>

            {orgMode === "existing" && (
              <Select value={existingOrgId} onValueChange={setExistingOrgId}>
                <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                <SelectContent>
                  {(orgs ?? []).map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {orgMode === "new" && (
              <div className="space-y-3 rounded-md border p-3 bg-muted/20">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={orgType} onValueChange={setOrgType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Private Company">Private Company</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} placeholder="https://" />
                  </div>
                </div>
              </div>
            )}

            {orgMode === "skip" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> No organization attached. You can add one later on the deal.
              </p>
            )}
          </section>

          {/* Contact */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Contact
              </h3>
              <ModeTabs value={contactMode} onChange={setContactMode} />
            </div>

            {contactMode === "existing" && (
              <Select value={existingContactId} onValueChange={setExistingContactId}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>
                  {filteredContacts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {contactMode === "new" && (
              <div className="space-y-3 rounded-md border p-3 bg-muted/20">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>First name *</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last name *</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Manager, Owner..." />
                  </div>
                </div>
              </div>
            )}

            {contactMode === "skip" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> No contact attached. Perfect for card-drop-only prospects.
              </p>
            )}
          </section>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Converting..." : "Convert to Deal"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}