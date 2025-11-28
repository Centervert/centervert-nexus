import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
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
import { format } from "date-fns";
import { ResourceManager } from "@/components/opportunities/ResourceManager";
import { OpportunityDialog } from "@/components/opportunities/OpportunityDialog";
import { OpportunityUpdates } from "@/components/opportunities/OpportunityUpdates";
import { OpportunityTeamMembers } from "@/components/opportunities/OpportunityTeamMembers";
import UnifiedLayout from "@/components/UnifiedLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOpportunity();
    loadResources();
  }, [id]);

  const loadOpportunity = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(
          `
          *,
          contacts (first_name, last_name, email, phone),
          organizations (name, phone, website),
          profiles:owner_id (full_name, email)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setOpportunity(data);
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

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunity_attachments")
        .select("*")
        .eq("opportunity_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      console.error("Error loading resources:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({ status: newStatus as any })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      loadOpportunity();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opportunity deleted successfully",
      });
      navigate("/opportunities");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="flex-1 p-8">Loading...</div>
      </UnifiedLayout>
    );
  }

  if (!opportunity) {
    return (
      <UnifiedLayout>
        <div className="flex-1 p-8">Opportunity not found</div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/opportunities")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{opportunity.name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="capitalize">{opportunity.type}</span>
            <span className="text-foreground">•</span>
            <span className="capitalize">{opportunity.status.replace(/_/g, " ")}</span>
            {opportunity.priority && (
              <>
                <span className="text-foreground">•</span>
                <span className="capitalize">{opportunity.priority}</span>
              </>
            )}
          </div>
        </div>
        <Button onClick={() => setShowEditDialog(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
              <Select value={opportunity.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="working_on_rfp">Working on RFP</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {opportunity.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1">{opportunity.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {opportunity.due_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <p className="mt-1">{format(new Date(opportunity.due_date), "MMM d, yyyy")}</p>
                </div>
              )}
              {opportunity.award_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Award Date</p>
                  <p className="mt-1">{format(new Date(opportunity.award_date), "MMM d, yyyy")}</p>
                </div>
              )}
            </div>
            {opportunity.profiles && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manager</p>
                <p className="mt-1">{opportunity.profiles.full_name || opportunity.profiles.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {(opportunity.contacts || opportunity.organizations) && (
          <Card>
            <CardHeader>
              <CardTitle>Requestor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {opportunity.contacts && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <p className="mt-1 font-medium">
                    {opportunity.contacts.first_name} {opportunity.contacts.last_name}
                  </p>
                  {opportunity.contacts.email && <p className="text-sm">{opportunity.contacts.email}</p>}
                  {opportunity.contacts.phone && <p className="text-sm">{opportunity.contacts.phone}</p>}
                </div>
              )}
              {opportunity.organizations && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organization</p>
                  <p className="mt-1 font-medium">{opportunity.organizations.name}</p>
                  {opportunity.organizations.phone && <p className="text-sm">{opportunity.organizations.phone}</p>}
                  {opportunity.organizations.website && (
                    <a
                      href={opportunity.organizations.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {opportunity.organizations.website}
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {opportunity.submission_location_type && (
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location Type</p>
                <p className="mt-1 capitalize">{opportunity.submission_location_type.replace("_", " ")}</p>
              </div>
              {opportunity.submission_address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="mt-1">{opportunity.submission_address}</p>
                </div>
              )}
              {opportunity.submission_link && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Link</p>
                  <a
                    href={opportunity.submission_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-primary hover:underline break-all"
                  >
                    {opportunity.submission_link}
                  </a>
                </div>
              )}
              {opportunity.submission_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1">{opportunity.submission_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resources Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceManager
              opportunityId={id!}
              opportunityType={opportunity.type}
              resources={resources}
              onResourcesChange={loadResources}
            />
          </CardContent>
        </Card>

        {/* Team Members */}
        <div className="md:col-span-2">
          <OpportunityTeamMembers 
            opportunityId={id!} 
            managerId={opportunity.owner_id}
          />
        </div>

        {/* Activity Feed */}
        <div className="md:col-span-2">
          <OpportunityUpdates opportunityId={id!} />
        </div>
      </div>

      <div className="pt-8">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Opportunity
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this opportunity. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <OpportunityDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        opportunity={opportunity}
        onSuccess={() => {
          loadOpportunity();
          setShowEditDialog(false);
        }}
      />
      </div>
    </UnifiedLayout>
  );
}
