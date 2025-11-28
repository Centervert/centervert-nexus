import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Mail, Phone, Globe, Building2, ExternalLink, Trash2 } from "lucide-react";
import { EditableCell } from "@/components/contacts/EditableCell";
import { EditableAddressCell } from "@/components/contacts/EditableAddressCell";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phoneUtils";
import { toast } from "sonner";
import BillComActivityFeed from "@/components/billing/BillComActivityFeed";
import BillComStatusBadge from "@/components/billing/BillComStatusBadge";
import OrganizationBillingSummary from "@/components/billing/OrganizationBillingSummary";
import InvoiceTable from "@/components/billing/InvoiceTable";
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

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  is_primary: boolean | null;
}

function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["organization-contacts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email, phone, title, is_primary")
        .eq("organization_id", id)
        .order("is_primary", { ascending: false })
        .order("first_name", { ascending: true });
      if (error) throw error;
      return data as Contact[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization deleted successfully");
      navigate("/organizations");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete organization", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<typeof organization>) => {
      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", id] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update organization");
      console.error(error);
    },
  });

  const handleFieldUpdate = (field: string, value: string) => {
    if (field === "phone") {
      updateMutation.mutate({ [field]: normalizePhoneNumber(value) || null });
    } else {
      updateMutation.mutate({ [field]: value || null });
    }
  };

  const handleStatusToggle = (checked: boolean) => {
    updateMutation.mutate({ is_active: checked });
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!organization) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Organization not found</p>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/organizations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Organizations</h1>
        </div>

        {/* Billing Section */}
        <div className="space-y-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Billing</h2>
            <OrganizationBillingSummary organizationId={id!} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Invoices</h3>
            <InvoiceTable organizationId={id} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Organization details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              {/* Organization header with logo placeholder and name */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold mb-2">{organization.name}</h2>
                  {organization.website && (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {organization.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Key information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Key information</h3>
                <div className="grid gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={organization.is_active ?? true}
                        onCheckedChange={handleStatusToggle}
                      />
                      <span className="text-sm">
                        {organization.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Bill.com Link Status</div>
                    <BillComStatusBadge 
                      billcomCustomerId={organization.billcom_customer_id}
                      billingEmail={organization.billing_email}
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Contact information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Contact information</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Billing Email
                    </div>
                    <EditableCell
                      value={organization.billing_email}
                      onSave={(value) => handleFieldUpdate("billing_email", value)}
                      placeholder="billing@organization.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </div>
                    <EditableCell
                      value={organization.phone}
                      onSave={(value) => handleFieldUpdate("phone", value)}
                      placeholder="(555) 123-4567"
                      type="tel"
                      displayValue={organization.phone ? formatPhoneNumber(organization.phone) : undefined}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Website
                    </div>
                    <EditableCell
                      value={organization.website}
                      onSave={(value) => handleFieldUpdate("website", value)}
                      placeholder="https://example.com"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Organization profile */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Organization profile</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Address</div>
                    <EditableAddressCell
                      value={organization.address}
                      onSave={(value) => handleFieldUpdate("address", value)}
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Notes</h3>
                <EditableCell
                  value={organization.notes}
                  onSave={(value) => handleFieldUpdate("notes", value)}
                  placeholder="Add notes about this organization..."
                  type="text"
                />
              </div>
            </Card>
          </div>

          {/* Right column - Contacts */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Contacts {contacts.length > 0 && `(${contacts.length})`}
                </h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/contacts?organization=${id}`)}
                >
                  + Add
                </Button>
              </div>
              
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No contacts yet
                </p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="pb-4 border-b last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {contact.first_name[0]}{contact.last_name[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {contact.first_name} {contact.last_name}
                            {contact.is_primary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="text-xs text-muted-foreground">
                              {formatPhoneNumber(contact.phone)}
                            </div>
                          )}
                          {contact.title && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {contact.title}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/contacts?organization=${id}`)}
                  >
                    View all associated Contacts →
                  </Button>
                </div>
              )}
            </Card>

            {/* Bill.com Activity Feed */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Bill.com Activity</h3>
              <BillComActivityFeed organizationId={id!} />
            </Card>
          </div>
        </div>

        {/* Delete Section at Bottom */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between max-w-4xl">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this organization and all associated data
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Organization
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {organization?.name}? This will also affect all associated contacts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnifiedLayout>
  );
}

export default OrganizationDetail;
