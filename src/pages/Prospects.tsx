import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MapPin } from "lucide-react";
import { ProspectDialog } from "@/components/prospects/ProspectDialog";
import { formatDistanceToNow } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  warm: "Warm",
  cold: "Cold",
  do_not_contact: "Do Not Contact",
  converted: "Converted",
};

const STATUS_COLORS: Record<string, string> = {
  new: "text-blue-600",
  warm: "text-orange-600",
  cold: "text-slate-500",
  do_not_contact: "text-red-600",
  converted: "text-green-600",
};

export default function Prospects() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: prospects, refetch, isLoading } = useQuery({
    queryKey: ["prospects", search, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("prospects")
        .select("*, prospect_visits(id, visited_at)")
        .order("updated_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <UnifiedLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prospects</h1>
            <p className="text-muted-foreground">
              Businesses we've canvassed or plan to visit.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Prospect
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : !prospects || prospects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No prospects yet. Add one to start tracking canvassing.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((p: any) => {
                  const visits = p.prospect_visits ?? [];
                  const last = visits
                    .map((v: any) => new Date(v.visited_at))
                    .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/prospects/${p.id}`)}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {p.address ? (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {p.address}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{visits.length}</TableCell>
                      <TableCell>
                        {last ? formatDistanceToNow(last, { addSuffix: true }) : <span className="text-muted-foreground">Never</span>}
                      </TableCell>
                      <TableCell>
                        <span className={STATUS_COLORS[p.status] ?? ""}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ProspectDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={refetch} />
    </UnifiedLayout>
  );
}