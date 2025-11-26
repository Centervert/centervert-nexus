import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Trash2 } from "lucide-react";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phoneUtils";
import { EditableCell } from "@/components/contacts/EditableCell";
import { EditableSelectCell } from "@/components/contacts/EditableSelectCell";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          companies (
            id,
            name,
            website,
            phone,
            address,
            billing_email
          )
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted successfully");
      navigate("/contacts");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete contact", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: any }) => {
      const updateData: any = { [field]: value };
      
      if (field === "phone") {
        updateData[field] = normalizePhoneNumber(value);
      }

      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      toast.success("Contact updated");
    },
    onError: (error) => {
      toast.error("Failed to update contact");
      console.error("Update error:", error);
    },
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">Loading...</div>
      </UnifiedLayout>
    );
  }

  if (!contact) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">Contact not found</div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contacts")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Contact
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback
                      className={`${getAvatarColor(contact.first_name)} text-white text-2xl`}
                    >
                      {getInitials(contact.first_name, contact.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {contact.first_name} {contact.last_name}
                    </h2>
                    {contact.title && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {contact.title}
                      </p>
                    )}
                    {contact.companies && (
                      <p className="text-sm text-muted-foreground">
                        at {contact.companies.name}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Key information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Email</div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <EditableCell
                          value={contact.email}
                          onSave={(value) => updateMutation.mutate({ field: "email", value })}
                          type="email"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Phone Number</div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <EditableCell
                          value={contact.phone}
                          onSave={(value) => updateMutation.mutate({ field: "phone", value })}
                          type="tel"
                          displayValue={contact.phone ? formatPhoneNumber(contact.phone) : undefined}
                          placeholder="--"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Company</div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <EditableSelectCell
                          value={contact.company_id}
                          onSave={(value) => updateMutation.mutate({ field: "company_id", value })}
                          options={companies || []}
                          placeholder="No company"
                          renderValue={(option) => {
                            if (!option || !contact.companies) return <span className="text-muted-foreground">No company</span>;
                            return (
                              <button
                                onClick={() => navigate(`/companies/${contact.companies.id}`)}
                                className="text-primary hover:underline text-left"
                              >
                                {contact.companies.name}
                              </button>
                            );
                          }}
                          onValueClick={(id) => navigate(`/companies/${id}`)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Job Title</div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <EditableCell
                          value={contact.title}
                          onSave={(value) => updateMutation.mutate({ field: "title", value })}
                          placeholder="--"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <Separator className="my-6" />

                {/* Visibility Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Visibility</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Show in All Contacts</div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={contact.show_in_all_contacts}
                          onCheckedChange={(checked) => updateMutation.mutate({ field: "show_in_all_contacts", value: checked })}
                        />
                        <span className="text-sm">{contact.show_in_all_contacts ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      First Name
                    </div>
                    <EditableCell
                      value={contact.first_name}
                      onSave={(value) => updateMutation.mutate({ field: "first_name", value })}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Last Name
                    </div>
                    <EditableCell
                      value={contact.last_name}
                      onSave={(value) => updateMutation.mutate({ field: "last_name", value })}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Email
                    </div>
                    <EditableCell
                      value={contact.email}
                      onSave={(value) => updateMutation.mutate({ field: "email", value })}
                      type="email"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Phone Number
                    </div>
                    <EditableCell
                      value={contact.phone}
                      onSave={(value) => updateMutation.mutate({ field: "phone", value })}
                      type="tel"
                      displayValue={contact.phone ? formatPhoneNumber(contact.phone) : undefined}
                      placeholder="--"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Job Title
                    </div>
                    <EditableCell
                      value={contact.title}
                      onSave={(value) => updateMutation.mutate({ field: "title", value })}
                      placeholder="--"
                    />
                  </div>

                  {contact.companies && (
                    <>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Company name
                        </div>
                        <div className="text-sm">
                          <button
                            onClick={() => navigate(`/companies/${contact.companies.id}`)}
                            className="text-primary hover:underline"
                          >
                            {contact.companies.name}
                          </button>
                        </div>
                      </div>

                      {contact.companies.website && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Company Website
                          </div>
                          <div className="text-sm">
                            <a
                              href={contact.companies.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {contact.companies.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {contact.companies.phone && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Company Phone
                          </div>
                          <div className="text-sm">
                            {formatPhoneNumber(contact.companies.phone)}
                          </div>
                        </div>
                      )}

                      {contact.companies.address && (
                        <div className="md:col-span-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Company Address
                          </div>
                          <div className="text-sm">{contact.companies.address}</div>
                        </div>
                      )}
                    </>
                  )}

                   <div className="md:col-span-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Address
                    </div>
                    <EditableCell
                      value={contact.address}
                      onSave={(value) => updateMutation.mutate({ field: "address", value })}
                      placeholder="--"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Notes
                    </div>
                    <EditableCell
                      value={contact.notes}
                      onSave={(value) => updateMutation.mutate({ field: "notes", value })}
                      placeholder="No notes"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact?.first_name} {contact?.last_name}? This action cannot be undone.
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
};

export default ContactDetail;
