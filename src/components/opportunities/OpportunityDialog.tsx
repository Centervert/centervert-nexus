import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/contacts/AddressAutocomplete";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { CompanyDialog } from "@/components/companies/CompanyDialog";

const formSchema = z.object({
  type: z.enum(["private", "government"]),
  name: z.string().min(1, "Opportunity name is required"),
  description: z.string().optional(),
  requestor_contact_id: z.string().optional(),
  requestor_organization_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  owner_id: z.string().min(1, "Opportunity manager is required"),
  team_member_ids: z.array(z.string()).optional(),
  due_date: z.date().optional(),
  award_date: z.date().optional(),
  submission_location_type: z.enum(["in_person", "online", "other"]).optional(),
  submission_address: z.string().optional(),
  submission_link: z.string().optional(),
  submission_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  opportunity?: any; // For edit mode
}

export function OpportunityDialog({ open, onOpenChange, onSuccess, opportunity }: OpportunityDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const isEditMode = !!opportunity;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      name: "",
      description: "",
      priority: undefined,
      owner_id: "",
      team_member_ids: [],
      requestor_contact_id: "",
      requestor_organization_id: "",
      submission_location_type: undefined,
    },
  });

  const selectedType = form.watch("type");
  const selectedSubmissionType = form.watch("submission_location_type");

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      console.log("Dialog opened, loading data...");
      loadData();
      
      // If editing, populate form with existing data
      if (opportunity) {
        // Load team members for edit mode
        supabase
          .from("opportunity_team_members")
          .select("user_id")
          .eq("opportunity_id", opportunity.id)
          .then(({ data }) => {
            const teamMemberIds = data?.map(tm => tm.user_id) || [];
            
            form.reset({
              type: opportunity.type,
              name: opportunity.name,
              description: opportunity.description || "",
              priority: opportunity.priority || undefined,
              owner_id: opportunity.owner_id || "",
              team_member_ids: teamMemberIds,
              requestor_contact_id: opportunity.requestor_contact_id || "",
              requestor_organization_id: opportunity.requestor_organization_id || "",
              submission_location_type: opportunity.submission_location_type || undefined,
              due_date: opportunity.due_date ? new Date(opportunity.due_date) : undefined,
              award_date: opportunity.award_date ? new Date(opportunity.award_date) : undefined,
              submission_address: opportunity.submission_address || "",
              submission_link: opportunity.submission_link || "",
              submission_notes: opportunity.submission_notes || "",
            });
          });
      }
    }
  }, [open, opportunity]);

  // Load all data when dialog opens
  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("Loading opportunity form data...");

      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .order("first_name");
      
      if (contactsError) {
        console.error("Error loading contacts:", contactsError);
        throw contactsError;
      }
      console.log("Loaded contacts:", contactsData);
      setContacts(contactsData || []);

      // Load organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      
      if (orgsError) {
        console.error("Error loading organizations:", orgsError);
        throw orgsError;
      }
      console.log("Loaded organizations:", orgsData);
      setOrganizations(orgsData || []);

      // Load managers using RPC
      const { data: managersData, error: managersError } = await supabase
        .rpc("get_users_with_roles");
      
      if (managersError) {
        console.error("Error loading managers:", managersError);
        throw managersError;
      }
      console.log("Loaded managers (raw):", managersData);
      
      // Filter to only admin and agent users
      const eligibleManagers = managersData?.filter((user: any) => 
        user.roles?.some((role: string) => role === 'admin' || role === 'agent')
      ) || [];
      
      console.log("Eligible managers after filtering:", eligibleManagers);
      setManagers(eligibleManagers);

      // Set current user as default manager
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const userId = sessionData.session.user.id;
        console.log("Setting default manager to current user:", userId);
        form.setValue("owner_id", userId);
      }

      console.log("Form data loaded successfully");
    } catch (error: any) {
      console.error("Failed to load form data:", error);
      toast({
        title: "Error",
        description: `Failed to load form data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form when closing
      form.reset();
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to create opportunities",
          variant: "destructive",
        });
        return;
      }

      const opportunityData = {
        name: data.name,
        description: data.description,
        type: data.type,
        priority: data.priority,
        owner_id: data.owner_id,
        due_date: data.due_date ? data.due_date.toISOString().split('T')[0] : null,
        award_date: data.award_date ? data.award_date.toISOString().split('T')[0] : null,
        requestor_contact_id: data.requestor_contact_id || null,
        requestor_organization_id: data.requestor_organization_id || null,
        submission_location_type: data.submission_location_type || null,
        submission_address: data.submission_address || null,
        submission_link: data.submission_link || null,
        submission_notes: data.submission_notes || null,
      };

      let opportunityId = opportunity?.id;

      if (isEditMode) {
        // Update existing opportunity
        const { error } = await supabase
          .from("opportunities")
          .update(opportunityData)
          .eq("id", opportunity.id);

        if (error) throw error;

        // Update team members for edit mode
        if (data.team_member_ids) {
          // Remove existing team members
          await supabase
            .from("opportunity_team_members")
            .delete()
            .eq("opportunity_id", opportunity.id);

          // Add new team members
          if (data.team_member_ids.length > 0) {
            const teamMembersData = data.team_member_ids.map(userId => ({
              opportunity_id: opportunity.id,
              user_id: userId,
              added_by: session.session.user.id,
            }));

            const { error: teamError } = await supabase
              .from("opportunity_team_members")
              .insert(teamMembersData);

            if (teamError) console.error("Error adding team members:", teamError);
          }
        }

        toast({
          title: "Success",
          description: "Opportunity updated successfully",
        });
      } else {
        // Create new opportunity
        const { data: newOpportunity, error } = await supabase
          .from("opportunities")
          .insert({
            ...opportunityData,
            created_by: session.session.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        opportunityId = newOpportunity.id;

        // Add team members for new opportunity
        if (data.team_member_ids && data.team_member_ids.length > 0) {
          const teamMembersData = data.team_member_ids.map(userId => ({
            opportunity_id: opportunityId,
            user_id: userId,
            added_by: session.session.user.id,
          }));

          const { error: teamError } = await supabase
            .from("opportunity_team_members")
            .insert(teamMembersData);

          if (teamError) console.error("Error adding team members:", teamError);
        }

        toast({
          title: "Success",
          description: "Opportunity created successfully. You can now add resources to it.",
        });
      }

      handleOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Opportunity" : "Create Opportunity"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update opportunity details" : "Add a new opportunity to track proposals and contracts"}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading form...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              {/* Type Selection - Always visible */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select opportunity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            {/* Rest of form - Blurred until type is selected */}
            <div className={cn(!selectedType && "pointer-events-none opacity-40 blur-sm")}>
              {/* Common Fields */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opportunity Name *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!selectedType} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={!selectedType} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Requestor Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requestor_contact_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Requestor (Contact)</FormLabel>
                        <Popover open={contactOpen} onOpenChange={setContactOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={!selectedType}
                                className={cn(
                                  "justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? contacts.find((c) => c.id === field.value)?.first_name + " " + contacts.find((c) => c.id === field.value)?.last_name
                                  : "Select contact"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Search contacts..." />
                              <CommandEmpty>No contact found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    setContactOpen(false);
                                    setShowContactDialog(true);
                                  }}
                                  className="text-primary"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create Contact
                                </CommandItem>
                                {contacts.map((contact) => (
                                  <CommandItem
                                    key={contact.id}
                                    value={`${contact.first_name} ${contact.last_name}`}
                                    onSelect={() => {
                                      form.setValue("requestor_contact_id", contact.id);
                                      setContactOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === contact.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {contact.first_name} {contact.last_name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestor_organization_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Requestor (Organization)</FormLabel>
                        <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={!selectedType}
                                className={cn(
                                  "justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? organizations.find((org) => org.id === field.value)?.name
                                  : "Select organization"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Search organizations..." />
                              <CommandEmpty>No organization found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    setOrgOpen(false);
                                    setShowOrgDialog(true);
                                  }}
                                  className="text-primary"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create Organization
                                </CommandItem>
                                {organizations.map((org) => (
                                  <CommandItem
                                    key={org.id}
                                    value={org.name}
                                    onSelect={() => {
                                      form.setValue("requestor_organization_id", org.id);
                                      setOrgOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === org.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {org.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedType}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="owner_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opportunity Manager *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedType}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {managers.length === 0 ? (
                              <div className="px-2 py-1 text-sm text-muted-foreground">No managers available</div>
                            ) : (
                              managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.full_name || manager.email}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="team_member_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Members (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              disabled={!selectedType || !form.watch("owner_id")}
                              className={cn(
                                "justify-between",
                                (!field.value || field.value.length === 0) && "text-muted-foreground"
                              )}
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} team member${field.value.length > 1 ? 's' : ''} selected`
                                : "Select team members"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search team members..." />
                            <CommandEmpty>No team members found.</CommandEmpty>
                            <CommandGroup>
                              {managers
                                .filter(m => m.id !== form.watch("owner_id"))
                                .map((manager) => (
                                  <CommandItem
                                    key={manager.id}
                                    onSelect={() => {
                                      const current = field.value || [];
                                      const updated = current.includes(manager.id)
                                        ? current.filter(id => id !== manager.id)
                                        : [...current, manager.id];
                                      form.setValue("team_member_ids", updated);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.includes(manager.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {manager.full_name || manager.email}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              disabled={!selectedType}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Award Date - Government only */}
                {selectedType === "government" && (
                  <FormField
                    control={form.control}
                    name="award_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Award Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Proposal Submission Location - Government only */}
                {selectedType === "government" && (
                  <FormField
                    control={form.control}
                    name="submission_location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposal Submission Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select submission type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_person">In-Person</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Conditional submission fields - Government only */}
                {selectedType === "government" && selectedSubmissionType === "in_person" && (
                  <FormField
                    control={form.control}
                    name="submission_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Address</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedType === "government" && selectedSubmissionType === "online" && (
                  <FormField
                    control={form.control}
                    name="submission_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Link</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedType === "government" && selectedSubmissionType === "other" && (
                  <FormField
                    control={form.control}
                    name="submission_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedType} className="flex-1">
                {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Opportunity" : "Create Opportunity")}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </SheetContent>
    </Sheet>

    {/* Contact Creation Dialog */}
    <ContactDialog
      open={showContactDialog}
      onOpenChange={(isOpen) => {
        setShowContactDialog(isOpen);
        if (!isOpen) {
          // Reload contacts when dialog closes
          loadData();
        }
      }}
    />

    {/* Organization Creation Dialog */}
    <CompanyDialog
      open={showOrgDialog}
      onOpenChange={(isOpen) => {
        setShowOrgDialog(isOpen);
        if (!isOpen) {
          // Reload organizations when dialog closes
          loadData();
        }
      }}
    />
    </>
  );
}
