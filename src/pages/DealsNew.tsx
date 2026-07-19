import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Plus, Search, DollarSign, LayoutGrid, List } from "lucide-react";
import { TemperatureDisplay } from "@/components/deals/TemperatureSlider";
import { DealDialog } from "@/components/deals/DealDialog";
import { Badge } from "@/components/ui/badge";
import { DealKanban, DEAL_STAGES, DealStage } from "@/components/deals/DealKanban";
import { WonDealDialog } from "@/components/deals/WonDealDialog";

interface Deal {
  id: string;
  name: string;
  owner_id: string | null;
  temperature: number;
  status: string;
  stage: string;
  expected_value: number | null;
  organization_id: string | null;
  prospect_id: string | null;
  created_at: string;
  owner?: { full_name: string | null; email: string } | null;
  organizations?: { name: string } | null;
}

export default function DealsNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<"board" | "table">("board");
  const [wonDeal, setWonDeal] = useState<Deal | null>(null);

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
    const isTerminal = deal.stage === "won" || deal.stage === "lost";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !isTerminal) ||
      statusFilter === deal.stage;
    const matchesSearch = deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStageBadge = (stage: string) => {
    const label = DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
    if (stage === "won") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{label}</Badge>;
    if (stage === "lost") return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{label}</Badge>;
    if (stage === "on_hold") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{label}</Badge>;
    return <Badge variant="secondary">{label}</Badge>;
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
    active: deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length,
    won: deals.filter((d) => d.stage === "won").length,
    lost: deals.filter((d) => d.stage === "lost").length,
  };

  const handleKanbanStageChange = async (dealId: string, newStage: DealStage) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    if (newStage === "lost") {
      const reason = window.prompt("Reason this deal was lost?");
      if (!reason) return;
      const { error } = await supabase.from("deals").update({ stage: newStage, lost_reason: reason } as any).eq("id", dealId);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      await loadDeals();
      return;
    }
    const { error } = await supabase.from("deals").update({ stage: newStage } as any).eq("id", dealId);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    if (newStage === "won" && !deal.organization_id) {
      setWonDeal({ ...deal, stage: newStage });
    }
    await loadDeals();
  };

  return (
    <UnifiedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
            <p className="text-muted-foreground">
              Track and manage your deals pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setView("board")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "board" ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >
                <LayoutGrid className="h-4 w-4" /> Board
              </button>
              <button
                onClick={() => setView("table")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "table" ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >
                <List className="h-4 w-4" /> Table
              </button>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {view === "table" && <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="active">
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger value="won">Won ({statusCounts.won})</TabsTrigger>
              <TabsTrigger value="lost">Lost ({statusCounts.lost})</TabsTrigger>
              <TabsTrigger value="all">All ({deals.length})</TabsTrigger>
            </TabsList>
          </Tabs>}

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
        ) : view === "board" ? (
          <DealKanban
            deals={(searchQuery ? filteredDeals : deals) as any}
            onStageChange={handleKanbanStageChange}
          />
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
                  <TableHead>Stage</TableHead>
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
                    <TableCell>{getStageBadge(deal.stage)}</TableCell>
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
      {wonDeal && (
        <WonDealDialog
          open={!!wonDeal}
          onOpenChange={(o) => !o && setWonDeal(null)}
          dealId={wonDeal.id}
          dealName={wonDeal.name}
          prospectId={wonDeal.prospect_id}
          onDone={() => { setWonDeal(null); loadDeals(); }}
        />
      )}
    </UnifiedLayout>
  );
}
