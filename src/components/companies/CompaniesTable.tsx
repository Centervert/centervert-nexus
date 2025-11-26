import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Pencil, Trash2, Mail, Phone, Globe } from "lucide-react";
import { CompanyDialog } from "./CompanyDialog";

interface Company {
  id: string;
  name: string;
  billing_email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean | null;
  contacts?: Array<{ count: number }>;
}

interface CompaniesTableProps {
  searchQuery: string;
  statusFilter: string;
}

export function CompaniesTable({ searchQuery, statusFilter }: CompaniesTableProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies", searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select(`
          *,
          contacts:contacts(count)
        `)
        .order("name", { ascending: true });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Company[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No companies found.</p>
        <p className="text-sm mt-2">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow 
                key={company.id}
                className="cursor-pointer"
                onClick={() => navigate(`/companies/${company.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {company.name}
                    {company.contacts?.[0]?.count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {company.contacts[0].count} {company.contacts[0].count === 1 ? 'contact' : 'contacts'}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {company.billing_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{company.billing_email}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{company.phone}</span>
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
                        setEditingCompany(company);
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
            ))}
          </TableBody>
        </Table>
      </div>

      <CompanyDialog
        open={!!editingCompany}
        onOpenChange={(open) => !open && setEditingCompany(null)}
        company={editingCompany || undefined}
      />

      <AlertDialog open={!!deletingCompanyId} onOpenChange={() => setDeletingCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this company. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingCompanyId!)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
