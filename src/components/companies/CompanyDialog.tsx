import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AddressAutocomplete } from "../contacts/AddressAutocomplete";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const companySchema = z.object({
  organization_type: z.enum(["private_company", "government", "non_profit"], {
    required_error: "Please select an organization type",
  }),
  name: z.string().min(1, "Organization name is required").max(200),
  billing_email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  website: z.string().max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  contact_option: z.enum(["create", "select"]).optional(),
  existing_contact_id: z.string().optional().or(z.literal("")),
  new_contact_first_name: z.string().optional().or(z.literal("")),
  new_contact_last_name: z.string().optional().or(z.literal("")),
  new_contact_email: z.string().optional().or(z.literal("")),
  new_contact_phone: z.string().optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: {
    id: string;
    name: string;
    billing_email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean | null;
  };
}

export function CompanyDialog({ open, onOpenChange, company }: CompanyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactOption, setContactOption] = useState<"create" | "select">("create");

  // Fetch existing contacts for selection
  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      organization_type: (company as any)?.organization_type || undefined,
      name: company?.name || "",
      billing_email: company?.billing_email || "",
      phone: company?.phone || "",
      website: company?.website || "",
      address: company?.address || "",
      notes: company?.notes || "",
      is_active: company?.is_active ?? true,
      contact_option: "create",
      existing_contact_id: "",
      new_contact_first_name: "",
      new_contact_last_name: "",
      new_contact_email: "",
      new_contact_phone: "",
    },
  });

  const selectedType = form.watch("organization_type");

  const getNameLabel = () => {
    if (!selectedType) return "Organization Name";
    switch (selectedType) {
      case "private_company":
        return "Company Name";
      case "government":
        return "Government Agency Name";
      case "non_profit":
        return "Non-Profit Name";
      default:
        return "Organization Name";
    }
  };

  const createMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      // First create the company
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert([{
          organization_type: values.organization_type,
          name: values.name,
          billing_email: values.billing_email || null,
          phone: normalizePhoneNumber(values.phone) || null,
          website: values.website || null,
          address: values.address || null,
          notes: values.notes || null,
          is_active: values.is_active,
        }])
        .select()
        .single();
      
      if (companyError) throw companyError;

      // Handle contact creation/linking if needed
      if (contactOption === "create" && values.new_contact_first_name && values.new_contact_last_name && values.new_contact_email) {
        const { error: contactError } = await supabase
          .from("contacts")
          .insert([{
            company_id: companyData.id,
            first_name: values.new_contact_first_name,
            last_name: values.new_contact_last_name,
            email: values.new_contact_email,
            phone: normalizePhoneNumber(values.new_contact_phone) || null,
          }]);
        
        if (contactError) throw contactError;
      } else if (contactOption === "select" && values.existing_contact_id) {
        const { error: linkError } = await supabase
          .from("contacts")
          .update({ company_id: companyData.id })
          .eq("id", values.existing_contact_id);
        
        if (linkError) throw linkError;
      }
      
      return companyData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Organization created successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating organization", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      const { data, error } = await supabase
        .from("companies")
        .update({
          organization_type: values.organization_type,
          name: values.name,
          billing_email: values.billing_email || null,
          phone: normalizePhoneNumber(values.phone) || null,
          website: values.website || null,
          address: values.address || null,
          notes: values.notes || null,
          is_active: values.is_active,
        })
        .eq("id", company!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({ title: "Organization updated successfully" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating organization", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true);
    try {
      if (company) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{company ? "Edit Organization" : "Create Organization"}</SheetTitle>
          <SheetDescription>
            {company ? "Update organization information" : "Enter the organization details below"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="organization_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private_company">Private Company</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="non_profit">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={!selectedType ? "opacity-30 pointer-events-none blur-sm" : "transition-all duration-300"}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getNameLabel()} *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name..." {...field} disabled={!selectedType} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="billing@organization.com" {...field} disabled={!selectedType} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} disabled={!selectedType} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://organization.com" {...field} disabled={!selectedType} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <AddressAutocomplete
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="123 Main St, City, State 12345"
                        disabled={!selectedType}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} disabled={!selectedType} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Section */}
              {!company && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Primary Contact (Optional)</Label>
                    <p className="text-sm text-muted-foreground">
                      Add or select a primary contact for this organization
                    </p>
                  </div>

                  <RadioGroup
                    value={contactOption}
                    onValueChange={(value) => setContactOption(value as "create" | "select")}
                    className="flex gap-4"
                    disabled={!selectedType}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="create" id="create" />
                      <Label htmlFor="create">Create new contact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="select" id="select" />
                      <Label htmlFor="select">Select existing contact</Label>
                    </div>
                  </RadioGroup>

                  {contactOption === "create" && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="new_contact_first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} disabled={!selectedType} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="new_contact_last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} disabled={!selectedType} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="new_contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} disabled={!selectedType} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="new_contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} disabled={!selectedType} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {contactOption === "select" && (
                    <FormField
                      control={form.control}
                      name="existing_contact_id"
                      render={({ field }) => (
                        <FormItem className="pt-2">
                          <FormLabel>Select Contact</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!selectedType}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a contact..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contacts?.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.first_name} {contact.last_name} ({contact.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable or disable this organization
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!selectedType} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : company ? "Update" : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
