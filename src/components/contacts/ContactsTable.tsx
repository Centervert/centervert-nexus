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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ContactRow } from "./ContactRow";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  company_id: string | null;
  notes: string | null;
  is_primary: boolean | null;
  companies: {
    name: string;
  } | null;
}

interface ContactsTableProps {
  searchQuery: string;
  viewFilter: string;
}

export function ContactsTable({ searchQuery, viewFilter }: ContactsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", searchQuery, viewFilter],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select(`
          *,
          companies (
            name
          )
        `)
        .order("first_name", { ascending: true });

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      if (viewFilter === "withCompany") {
        query = query.not("company_id", "is", null);
      } else if (viewFilter === "withoutCompany") {
        query = query.is("company_id", null);
      } else if (viewFilter === "primary") {
        query = query.eq("is_primary", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && contacts) {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleSelectContact = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedContacts(newSelected);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact deleted successfully" });
      setDeletingContactId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting contact",
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

  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-md bg-card">
        <p>No contacts found.</p>
        <p className="text-sm mt-2">Try adjusting your search or filters.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(contacts.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = contacts.slice(startIndex, endIndex);

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={contacts && selectedContacts.size === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold text-foreground">NAME</TableHead>
              <TableHead className="font-semibold text-foreground">EMAIL</TableHead>
              <TableHead className="font-semibold text-foreground">PHONE NUMBER</TableHead>
              <TableHead className="font-semibold text-foreground">COMPANY</TableHead>
              <TableHead className="font-semibold text-foreground">TITLE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                onDelete={(id) => setDeletingContactId(id)}
                isSelected={selectedContacts.has(contact.id)}
                onSelectChange={handleSelectContact}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {page}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <span className="text-sm text-muted-foreground ml-4">
          {itemsPerPage} per page
        </span>
      </div>

      <AlertDialog open={!!deletingContactId} onOpenChange={() => setDeletingContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingContactId!)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
