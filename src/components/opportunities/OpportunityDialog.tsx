import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Link as LinkIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/contacts/AddressAutocomplete";

const formSchema = z.object({
  type: z.enum(["private", "government"]),
  name: z.string().min(1, "Opportunity name is required"),
  description: z.string().optional(),
  requestor_contact_id: z.string().optional(),
  requestor_organization_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
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
}

export function OpportunityDialog({ open, onOpenChange, onSuccess }: OpportunityDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      name: "",
      description: "",
      priority: undefined,
    },
  });

  const selectedType = form.watch("type");
  const selectedSubmissionType = form.watch("submission_location_type");

  // Fetch contacts and organizations
  const loadRequestors = async () => {
    const [contactsRes, orgsRes] = await Promise.all([
      supabase.from("contacts").select("id, first_name, last_name"),
      supabase.from("organizations").select("id, name"),
    ]);

    if (contactsRes.data) setContacts(contactsRes.data);
    if (orgsRes.data) setOrganizations(orgsRes.data);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadRequestors();
      form.reset();
    }
    onOpenChange(open);
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

      const { error } = await supabase.from("opportunities").insert({
        name: data.name,
        description: data.description,
        type: data.type,
        priority: data.priority,
        due_date: data.due_date ? data.due_date.toISOString().split('T')[0] : null,
        award_date: data.award_date ? data.award_date.toISOString().split('T')[0] : null,
        requestor_contact_id: data.requestor_contact_id || null,
        requestor_organization_id: data.requestor_organization_id || null,
        submission_location_type: data.submission_location_type || null,
        submission_address: data.submission_address || null,
        submission_link: data.submission_link || null,
        submission_notes: data.submission_notes || null,
        owner_id: session.session.user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opportunity created successfully",
      });

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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Opportunity</SheetTitle>
          <SheetDescription>
            Add a new opportunity to track proposals and contracts
          </SheetDescription>
        </SheetHeader>

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
                      <FormItem>
                        <FormLabel>Requestor (Contact)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedType}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.first_name} {contact.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestor_organization_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requestor (Organization)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedType}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedType}>
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

                {/* Resources Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Resources</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!selectedType}
                      onClick={() => setShowResourcesMenu(!showResourcesMenu)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Resource
                    </Button>
                  </div>
                  {showResourcesMenu && (
                    <div className="border rounded-lg p-4 space-y-2">
                      <Button type="button" variant="ghost" className="w-full justify-start">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                      <Button type="button" variant="ghost" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedType === "government" ? "Upload RFP" : "Upload File"}
                      </Button>
                      {selectedType === "government" && (
                        <Button type="button" variant="ghost" className="w-full justify-start">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Supporting Documents
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Proposal Submission Location - Government only */}
                {selectedType === "government" && (
                  <FormField
                    control={form.control}
                    name="submission_location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposal Submission Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                {isSubmitting ? "Creating..." : "Create Opportunity"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
