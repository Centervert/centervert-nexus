import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, DollarSign } from "lucide-react";
import { TemperatureDisplay } from "@/components/deals/TemperatureSlider";
import { DealDialog } from "@/components/deals/DealDialog";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  name: string;
  owner_id: string | null;
  temperature: number;
  status: string;
  expected_value: number | null;
  organization_id: string | null;
  created_at: string;
  owner?: { full_name: string | null; email: string } | null;
  organizations?: { name: string } | null;
}

export default function DealsNew() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select(`
        *,
        owner:profiles!deals_owner_id_fkey(full_name, email),
        organizations:organization_id(name)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDeals(data as Deal[]);
    }
    setLoading(false);
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
    const matchesSearch = deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Won</Badge>;
      case "lost":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Lost</Badge>;
      default:
        return <Badge variant="secondary">Active</Badge>;
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statusCounts = {
    active: deals.filter((d) => d.status === "active").length,
    won: deals.filter((d) => d.status === "won").length,
    lost: deals.filter((d) => d.status === "lost").length,
  };

  return (
    <UnifiedLayout>
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Opportunities (NEW)</h1>
            <p className="text-muted-foreground">
              Track and manage your deals pipeline
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="active">
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger value="won">Won ({statusCounts.won})</TabsTrigger>
              <TabsTrigger value="lost">Lost ({statusCounts.lost})</TabsTrigger>
              <TabsTrigger value="all">All ({deals.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading deals...
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {deals.length === 0
              ? "No deals yet. Create your first deal to get started."
              : "No deals match your filters."}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <TableCell className="font-medium">{deal.name}</TableCell>
                    <TableCell>
                      {deal.organizations?.name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {deal.owner?.full_name || deal.owner?.email || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TemperatureDisplay value={deal.temperature} size="sm" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {deal.expected_value ? (
                          <>
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span>{formatCurrency(deal.expected_value).replace("$", "")}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(deal.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadDeals}
      />
    </UnifiedLayout>
  );
}
