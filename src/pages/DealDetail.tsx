import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Building2, 
  User, 
  DollarSign, 
  Pencil,
  Trash2,
  MessageSquare,
  FileText,
  History as HistoryIcon,
} from "lucide-react";
import { TemperatureSlider } from "@/components/deals/TemperatureSlider";
import { DealDialog } from "@/components/deals/DealDialog";
import { DealChat } from "@/components/deals/DealChat";
import { RecordHistory } from "@/components/history/RecordHistory";
import { DealDocuments } from "@/components/deals/DealDocuments";
import { WonDealDialog } from "@/components/deals/WonDealDialog";
import { DEAL_STAGES } from "@/components/deals/DealKanban";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Deal {
  id: string;
  name: string;
  owner_id: string | null;
  temperature: number;
  description: string | null;
  status: string;
  stage: string;
  lost_reason: string | null;
  prospect_id: string | null;
  organization_id: string | null;
  contact_id: string | null;
  expected_value: number | null;
  created_at: string;
  owner?: { full_name: string | null; email: string } | null;
  organizations?: { name: string } | null;
  contacts?: { first_name: string; last_name: string } | null;
  prospect?: { name: string } | null;
}

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [wonOpen, setWonOpen] = useState(false);

  useEffect(() => {
    if (id) loadDeal();
  }, [id]);

  const loadDeal = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select(`
        *,
        owner:profiles!deals_owner_id_fkey(full_name, email),
        organizations:organization_id(name),
        contacts:contact_id(first_name, last_name),
        prospect:prospect_id(name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error loading deal",
        description: error.message,
        variant: "destructive",
      });
      navigate("/deals");
    } else {
      setDeal(data as Deal);
    }
    setLoading(false);
  };

  const handleStageChange = async (newStage: string) => {
    if (!deal) return;
    const patch: any = { stage: newStage };
    if (newStage === "lost") {
      const reason = window.prompt("Reason this deal was lost?");
      if (!reason) return;
      patch.lost_reason = reason;
    }
    const { error } = await supabase.from("deals").update(patch).eq("id", deal.id);
    if (error) {
      toast({ title: "Error updating stage", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Stage updated" });
    await loadDeal();
    if (newStage === "won" && !deal.organization_id) setWonOpen(true);
  };

  const handleTemperatureChange = async (newTemp: number) => {
    if (!deal) return;

    const { error } = await supabase
      .from("deals")
      .update({ temperature: newTemp })
      .eq("id", deal.id);

    if (error) {
      toast({
        title: "Error updating temperature",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDeal({ ...deal, temperature: newTemp });
    }
  };

  const handleDelete = async () => {
    if (!deal) return;

    const { error } = await supabase.from("deals").delete().eq("id", deal.id);

    if (error) {
      toast({
        title: "Error deleting deal",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Deal deleted" });
      navigate("/deals");
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Not set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageBadge = (stage: string) => {
    const label = DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
    if (stage === "won") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{label}</Badge>;
    if (stage === "lost") return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{label}</Badge>;
    if (stage === "on_hold") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{label}</Badge>;
    return <Badge variant="secondary">{label}</Badge>;
  };

  if (loading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading deal...
        </div>
      </UnifiedLayout>
    );
  }

  if (!deal) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Deal not found
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/deals")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{deal.name}</h1>
                {getStageBadge(deal.stage)}
              </div>
              <div className="text-sm text-muted-foreground space-x-3">
                {deal.organizations?.name && (
                  <Link to={`/organizations/${deal.organization_id}`} className="hover:underline">
                    {deal.organizations.name}
                  </Link>
                )}
                {deal.prospect?.name && (
                  <Link to={`/prospects/${deal.prospect_id}`} className="hover:underline">
                    ← From Prospect: {deal.prospect.name}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this deal? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Deal info */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Deal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stage */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stage</label>
                  <Select value={deal.stage} onValueChange={handleStageChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {deal.stage === "lost" && deal.lost_reason && (
                    <p className="text-xs text-muted-foreground mt-1">Reason: {deal.lost_reason}</p>
                  )}
                  {deal.stage === "won" && !deal.organization_id && (
                    <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setWonOpen(true)}>
                      Create Organization from this deal
                    </Button>
                  )}
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Temperature</label>
                  <div className="mt-2">
                    <TemperatureSlider
                      value={deal.temperature}
                      onChange={handleTemperatureChange}
                    />
                  </div>
                </div>

                {/* Owner */}
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Owner</p>
                    <p className="font-medium">
                      {deal.owner?.full_name || deal.owner?.email || "Unassigned"}
                    </p>
                  </div>
                </div>

                {/* Organization */}
                {deal.organization_id && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Organization</p>
                      <Link 
                        to={`/organizations/${deal.organization_id}`}
                        className="font-medium hover:underline"
                      >
                        {deal.organizations?.name}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Contact */}
                {deal.contact_id && deal.contacts && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact</p>
                      <Link 
                        to={`/contacts/${deal.contact_id}`}
                        className="font-medium hover:underline"
                      >
                        {deal.contacts.first_name} {deal.contacts.last_name}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Expected Value */}
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expected Value</p>
                    <p className="font-medium">{formatCurrency(deal.expected_value)}</p>
                  </div>
                </div>

                {/* Description */}
                {deal.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{deal.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Chat & Documents */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList>
                    <TabsTrigger value="chat" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <HistoryIcon className="h-4 w-4" />
                      History
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {activeTab === "chat" && <DealChat dealId={deal.id} />}
                {activeTab === "documents" && <DealDocuments dealId={deal.id} />}
                {activeTab === "history" && <RecordHistory tableName="deals" recordId={deal.id} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DealDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={loadDeal}
        deal={deal}
      />
      <WonDealDialog
        open={wonOpen}
        onOpenChange={setWonOpen}
        dealId={deal.id}
        dealName={deal.name}
        prospectId={deal.prospect_id}
        onDone={loadDeal}
      />
    </UnifiedLayout>
  );
}
