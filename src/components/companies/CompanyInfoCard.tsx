import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Globe, MapPin, Pencil, Check, X } from "lucide-react";

interface Company {
  id: string;
  name: string;
  billing_email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean | null;
}

interface CompanyInfoCardProps {
  company: Company;
}

export function CompanyInfoCard({ company }: CompanyInfoCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState({
    billing_email: company.billing_email || "",
    phone: company.phone || "",
    website: company.website || "",
    address: company.address || "",
    notes: company.notes || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof editedCompany) => {
      const { error } = await supabase
        .from("companies")
        .update({
          billing_email: values.billing_email || null,
          phone: values.phone || null,
          website: values.website || null,
          address: values.address || null,
          notes: values.notes || null,
        })
        .eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", company.id] });
      toast({ title: "Company updated successfully" });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating company",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editedCompany);
  };

  const handleCancel = () => {
    setEditedCompany({
      billing_email: company.billing_email || "",
      phone: company.phone || "",
      website: company.website || "",
      address: company.address || "",
      notes: company.notes || "",
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Billing Email
              </label>
              <Input
                type="email"
                value={editedCompany.billing_email}
                onChange={(e) =>
                  setEditedCompany({
                    ...editedCompany,
                    billing_email: e.target.value,
                  })
                }
                placeholder="billing@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Phone</label>
              <Input
                value={editedCompany.phone}
                onChange={(e) =>
                  setEditedCompany({ ...editedCompany, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Website</label>
              <Input
                value={editedCompany.website}
                onChange={(e) =>
                  setEditedCompany({
                    ...editedCompany,
                    website: e.target.value,
                  })
                }
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Address</label>
              <Textarea
                value={editedCompany.address}
                onChange={(e) =>
                  setEditedCompany({
                    ...editedCompany,
                    address: e.target.value,
                  })
                }
                placeholder="123 Main St, City, State 12345"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Textarea
            value={editedCompany.notes}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, notes: e.target.value })
            }
            placeholder="Additional notes..."
            rows={8}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4 p-6 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Company Information</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {company.billing_email && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Billing Email</p>
                <p className="text-sm">{company.billing_email}</p>
              </div>
            </div>
          )}
          {company.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm">{company.phone}</p>
              </div>
            </div>
          )}
          {company.website && (
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {company.website}
                </a>
              </div>
            </div>
          )}
          {company.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm">{company.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {company.notes && (
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {company.notes}
          </p>
        </div>
      )}
    </div>
  );
}
