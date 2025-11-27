import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { OpportunitiesTable } from "@/components/opportunities/OpportunitiesTable";
import { OpportunityDialog } from "@/components/opportunities/OpportunityDialog";

export default function Opportunities() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"all" | "my">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    filterOpportunities();
  }, [opportunities, searchQuery, activeView, currentUserId]);

  const loadOpportunities = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        setCurrentUserId(session.session.user.id);
      }

      const { data, error } = await supabase
        .from("opportunities")
        .select(
          `
          *,
          contacts (first_name, last_name),
          organizations (name),
          profiles:owner_id (full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterOpportunities = () => {
    let filtered = [...opportunities];

    // Filter by view
    if (activeView === "my" && currentUserId) {
      filtered = filtered.filter(
        (opp) => opp.owner_id === currentUserId || opp.created_by === currentUserId
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.name.toLowerCase().includes(query) ||
          opp.description?.toLowerCase().includes(query) ||
          opp.type.toLowerCase().includes(query) ||
          opp.status.toLowerCase().includes(query)
      );
    }

    setFilteredOpportunities(filtered);
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Opportunities</h2>
          <p className="text-muted-foreground">Track and manage your business opportunities</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Opportunity
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "all" | "my")}>
          <TabsList>
            <TabsTrigger value="all">All Opportunities</TabsTrigger>
            <TabsTrigger value="my">My Opportunities</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading opportunities...</div>
      ) : (
        <OpportunitiesTable opportunities={filteredOpportunities} />
      )}

      <OpportunityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadOpportunities}
      />
    </div>
  );
}
