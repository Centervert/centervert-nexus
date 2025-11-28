import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyRow } from "./CompanyRow";

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
  contacts?: Array<{ count: number }>;
}

interface CompaniesTableProps {
  searchQuery: string;
  statusFilter: string;
}

export function CompaniesTable({ searchQuery, statusFilter }: CompaniesTableProps) {

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies", searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("organizations")
        .select("*")
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
        <p>No organizations found.</p>
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
              <TableHead>Organization Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Bill.com Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <CompanyRow key={company.id} company={company} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
