import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface WonDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealName: string;
  prospectId?: string | null;
  onDone: () => void;
}

export function WonDealDialog({ open, onOpenChange, dealId, dealName, prospectId, onDone }: WonDealDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState(dealName);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setOrgName(dealName);
    setAddress(""); setPhone(""); setWebsite("");
    setContactFirst(""); setContactLast(""); setContactEmail(""); setContactPhone("");
    if (prospectId) {
      supabase.from("prospects").select("address,phone,website").eq("id", prospectId).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setAddress(data.address ?? "");
            setPhone(data.phone ?? "");
            setWebsite(data.website ?? "");
          }
        });
    }
  }, [open, prospectId, dealName]);

  const skip = () => {
    onDone();
    onOpenChange(false);
  };

  const create = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({
          name: orgName,
          address: address || null,
          phone: phone || null,
          website: website || null,
          is_active: true,
          created_by: userData.user?.id ?? null,
        } as any)
        .select("id")
        .single();
      if (orgErr) throw orgErr;

      let contactId: string | null = null;
      if (contactFirst || contactLast || contactEmail) {
        const { data: c, error: cErr } = await supabase
          .from("contacts")
          .insert({
            first_name: contactFirst || "",
            last_name: contactLast || "",
            email: contactEmail || "",
            phone: contactPhone || null,
            organization_id: org.id,
          } as any)
          .select("id")
          .single();
        if (cErr) throw cErr;
        contactId = c.id;
      }

      await supabase
        .from("deals")
        .update({ organization_id: org.id, ...(contactId ? { contact_id: contactId } : {}) })
        .eq("id", dealId);

      toast({ title: "Organization created", description: `${orgName} is now a client.` });
      onDone();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎉 Deal Won — Create Organization?</DialogTitle>
          <DialogDescription>
            Turn this deal into a client organization so you can invoice and manage them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Organization Name *</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>

          <Separator />
          <div className="text-sm font-medium text-muted-foreground">Add a primary contact (optional)</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name</Label>
              <Input value={contactFirst} onChange={(e) => setContactFirst(e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={contactLast} onChange={(e) => setContactLast(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={skip} disabled={loading}>Skip for now</Button>
          <Button onClick={create} disabled={loading || !orgName.trim()}>
            {loading ? "Creating..." : "Create Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}