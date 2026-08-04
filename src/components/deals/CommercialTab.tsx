import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRICING_MODELS, APPROVAL_STATUSES } from "@/lib/crm";
import { toast } from "sonner";

interface Props {
  deal: any;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}

const APPROVALS = [
  { field: "contract_status", label: "Contract status" },
  { field: "legal_review_status", label: "Legal review" },
  { field: "security_review_status", label: "Security review" },
  { field: "po_status", label: "PO status" },
];

export function CommercialTab({ deal, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pricing_model: deal.pricing_model ?? "",
    quoted_amount: deal.quoted_amount ?? "",
    scope_summary: deal.scope_summary ?? "",
    payment_schedule: deal.payment_schedule ?? "",
    contract_status: deal.contract_status ?? "",
    legal_review_status: deal.legal_review_status ?? "",
    security_review_status: deal.security_review_status ?? "",
    po_status: deal.po_status ?? "",
    signer_name: deal.signer_name ?? "",
    signer_title: deal.signer_title ?? "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Pricing model</Label>
          <Select value={form.pricing_model || undefined} onValueChange={(v) => set("pricing_model", v)}>
            <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
            <SelectContent>
              {PRICING_MODELS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Quoted amount</Label>
          <Input
            type="number"
            value={form.quoted_amount}
            onChange={(e) => set("quoted_amount", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Scope summary</Label>
          <Textarea
            rows={3}
            value={form.scope_summary}
            onChange={(e) => set("scope_summary", e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Payment schedule</Label>
          <Textarea
            rows={2}
            placeholder="50% on signature, 50% on delivery"
            value={form.payment_schedule}
            onChange={(e) => set("payment_schedule", e.target.value)}
          />
        </div>
        {APPROVALS.map((a) => (
          <div key={a.field} className="space-y-1.5">
            <Label>{a.label}</Label>
            <Select
              value={(form as any)[a.field] || undefined}
              onValueChange={(v) => set(a.field, v)}
            >
              <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
              <SelectContent>
                {APPROVAL_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>Signer name</Label>
          <Input value={form.signer_name} onChange={(e) => set("signer_name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Signer title</Label>
          <Input value={form.signer_title} onChange={(e) => set("signer_title", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({
              pricing_model: form.pricing_model || null,
              quoted_amount: form.quoted_amount === "" ? null : Number(form.quoted_amount),
              scope_summary: form.scope_summary || null,
              payment_schedule: form.payment_schedule || null,
              contract_status: form.contract_status || null,
              legal_review_status: form.legal_review_status || null,
              security_review_status: form.security_review_status || null,
              po_status: form.po_status || null,
              signer_name: form.signer_name || null,
              signer_title: form.signer_title || null,
            });
            setSaving(false);
            toast.success("Commercial details saved");
          }}
        >
          Save commercial details
        </Button>
      </div>
    </div>
  );
}