import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Mail, Phone, Globe, Check, X } from "lucide-react";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phoneUtils";
import BillComStatusBadge from "@/components/billing/BillComStatusBadge";

interface Company {
  id: string;
  name: string;
  billing_email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean | null;
  billcom_customer_id: string | null;
}

interface CompanyRowProps {
  company: Company;
}

export function CompanyRow({ company }: CompanyRowProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  const [editedCompany, setEditedCompany] = useState({
    name: company.name,
    billing_email: company.billing_email || "",
    phone: company.phone || "",
    website: company.website || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof editedCompany) => {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: values.name,
          billing_email: values.billing_email || null,
          phone: normalizePhoneNumber(values.phone) || null,
          website: values.website || null,
        })
        .eq("id", company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({ title: "Company deleted successfully" });
      setDeletingCompanyId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting company",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedCompany.name.trim()) {
      toast({
        title: "Validation error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(editedCompany);
  };

  const handleCancel = () => {
    setEditedCompany({
      name: company.name,
      billing_email: company.billing_email || "",
      phone: company.phone || "",
      website: company.website || "",
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <>
        <TableRow>
          <TableCell>
            <Input
              value={editedCompany.name}
              onChange={(e) =>
                setEditedCompany({ ...editedCompany, name: e.target.value })
              }
              placeholder="Company name"
              className="h-8"
            />
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Input
                value={editedCompany.billing_email}
                onChange={(e) =>
                  setEditedCompany({
                    ...editedCompany,
                    billing_email: e.target.value,
                  })
                }
                placeholder="billing@company.com"
                type="email"
                className="h-8 text-sm"
              />
              <Input
                value={editedCompany.phone}
                onChange={(e) =>
                  setEditedCompany({ ...editedCompany, phone: e.target.value })
                }
                placeholder="Phone"
                className="h-8 text-sm"
              />
            </div>
          </TableCell>
          <TableCell>
            <Input
              value={editedCompany.website}
              onChange={(e) =>
                setEditedCompany({ ...editedCompany, website: e.target.value })
              }
              placeholder="https://..."
              className="h-8 text-sm"
            />
          </TableCell>
          <TableCell>
            <BillComStatusBadge 
              billcomCustomerId={company.billcom_customer_id}
              billingEmail={company.billing_email}
            />
          </TableCell>
          <TableCell>
            <Badge variant={company.is_active ? "default" : "secondary"}>
              {company.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
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
          </TableCell>
        </TableRow>
      </>
    );
  }

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => navigate(`/organizations/${company.id}`)}
      >
        <TableCell className="font-medium">{company.name}</TableCell>
        <TableCell>
          <div className="space-y-1">
            {company.billing_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {company.billing_email}
                </span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{formatPhoneNumber(company.phone)}</span>
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-3 w-3" />
              Visit
            </a>
          )}
        </TableCell>
        <TableCell>
          <BillComStatusBadge 
            billcomCustomerId={company.billcom_customer_id}
            billingEmail={company.billing_email}
          />
        </TableCell>
        <TableCell>
          <Badge variant={company.is_active ? "default" : "secondary"}>
            {company.is_active ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingCompanyId(company.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog
        open={!!deletingCompanyId}
        onOpenChange={() => setDeletingCompanyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this company. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingCompanyId!)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
