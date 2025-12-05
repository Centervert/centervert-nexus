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
  SheetFooter,
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
  FormDescription,
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
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  project_type_id: z.string().min(1, "Project type is required"),
  name: z.string().min(1, "Project title is required"),
  description: z.string().optional(),
  organization_id: z.string().optional(),
  contact_id: z.string().optional(),
  owner_id: z.string().min(1, "Project owner is required"),
  start_date: z.date().optional(),
  target_end_date: z.date().optional(),
  // Development-specific fields stored in description or can be extended
  tech_stack: z.string().optional(),
  repository_url: z.string().optional(),
  staging_url: z.string().optional(),
  production_url: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  project?: any;
}

interface ProjectType {
  id: string;
  name: string;
  display_name: string;
  default_roles: any;
}

export function ProjectDialog({ open, onOpenChange, onSuccess, project }: ProjectDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [orgOpen, setOrgOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const isEditMode = !!project;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_type_id: "",
      name: "",
      description: "",
      organization_id: "",
      contact_id: "",
      owner_id: "",
      tech_stack: "",
      repository_url: "",
      staging_url: "",
      production_url: "",
    },
  });

  const selectedTypeId = form.watch("project_type_id");
  const selectedType = projectTypes.find((t) => t.id === selectedTypeId);
  const isDevelopmentProject = selectedType?.name === "development";

  useEffect(() => {
    if (open) {
      loadData();
      if (project) {
        form.reset({
          project_type_id: project.project_type_id || "",
          name: project.name || "",
          description: project.description || "",
          organization_id: project.organization_id || "",
          contact_id: project.contact_id || "",
          owner_id: project.owner_id || "",
          start_date: project.start_date ? new Date(project.start_date) : undefined,
          target_end_date: project.target_end_date ? new Date(project.target_end_date) : undefined,
        });
      }
    }
  }, [open, project]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load project types
      const { data: typesData } = await supabase
        .from("project_types")
        .select("*")
        .order("display_name");
      setProjectTypes(typesData || []);

      // Load organizations
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setOrganizations(orgsData || []);

      // Load contacts
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, organization_id")
        .order("first_name");
      setContacts(contactsData || []);

      // Load eligible owners (admin, agent, sales_agent)
      const { data: ownersData } = await supabase.rpc("get_users_with_roles");
      const eligibleOwners = ownersData?.filter((user: any) =>
        user.roles?.some((role: string) =>
          ["admin", "agent", "sales_agent"].includes(role)
        )
      ) || [];
      setOwners(eligibleOwners);

      // Set current user as default owner
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user && !project) {
        form.setValue("owner_id", session.session.user.id);
      }
    } catch (error: any) {
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
      form.reset();
    }
  };

  // Filter contacts by selected organization
  const filteredContacts = form.watch("organization_id")
    ? contacts.filter((c) => c.organization_id === form.watch("organization_id"))
    : contacts;

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to create projects",
          variant: "destructive",
        });
        return;
      }

      // Build description with tech details for development projects
      let fullDescription = data.description || "";
      if (isDevelopmentProject) {
        const techDetails = [];
        if (data.tech_stack) techDetails.push(`**Tech Stack:** ${data.tech_stack}`);
        if (data.repository_url) techDetails.push(`**Repository:** ${data.repository_url}`);
        if (data.staging_url) techDetails.push(`**Staging:** ${data.staging_url}`);
        if (data.production_url) techDetails.push(`**Production:** ${data.production_url}`);
        if (techDetails.length > 0) {
          fullDescription = fullDescription
            ? `${fullDescription}\n\n---\n\n${techDetails.join("\n")}`
            : techDetails.join("\n");
        }
      }

      const projectData = {
        project_type_id: data.project_type_id,
        name: data.name,
        description: fullDescription || null,
        organization_id: data.organization_id || null,
        contact_id: data.contact_id || null,
        owner_id: data.owner_id,
        start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : null,
        target_end_date: data.target_end_date ? format(data.target_end_date, "yyyy-MM-dd") : null,
        status: "active",
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", project.id);
        if (error) throw error;
        toast({ title: "Project updated successfully" });
      } else {
        const { error } = await supabase
          .from("projects")
          .insert({
            ...projectData,
            created_by: session.session.user.id,
          });
        if (error) throw error;
        toast({ title: "Project created successfully" });
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Project" : "Create Project"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update project details" : "Start a new project to track your work"}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading form...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              {/* Project Type Selection */}
              <FormField
                control={form.control}
                name="project_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rest of form - Blurred until type is selected */}
              <div className={cn(!selectedTypeId && "pointer-events-none opacity-40 blur-sm")}>
                <div className="space-y-6">
                  {/* Project Title */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project title" {...field} disabled={!selectedTypeId} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Project Overview */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Overview</FormLabel>
                        <FormDescription className="text-xs">
                          200-foot view — high-level summary of what this project is about
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the project scope, goals, and key deliverables..."
                            rows={4}
                            {...field}
                            disabled={!selectedTypeId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Client Selection */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Who is this project for?</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Organization */}
                      <FormField
                        control={form.control}
                        name="organization_id"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Organization</FormLabel>
                            <Popover open={orgOpen} onOpenChange={setOrgOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={!selectedTypeId}
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
                              <PopoverContent className="w-[280px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search organizations..." />
                                  <CommandEmpty>No organization found.</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {organizations.map((org) => (
                                      <CommandItem
                                        key={org.id}
                                        value={org.name}
                                        onSelect={() => {
                                          form.setValue("organization_id", org.id);
                                          // Clear contact if it doesn't belong to new org
                                          const currentContact = form.getValues("contact_id");
                                          if (currentContact) {
                                            const contact = contacts.find((c) => c.id === currentContact);
                                            if (contact?.organization_id !== org.id) {
                                              form.setValue("contact_id", "");
                                            }
                                          }
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

                      {/* Contact */}
                      <FormField
                        control={form.control}
                        name="contact_id"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Primary Contact</FormLabel>
                            <Popover open={contactOpen} onOpenChange={setContactOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={!selectedTypeId}
                                    className={cn(
                                      "justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? (() => {
                                          const c = contacts.find((c) => c.id === field.value);
                                          return c ? `${c.first_name} ${c.last_name}` : "Select contact";
                                        })()
                                      : "Select contact"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search contacts..." />
                                  <CommandEmpty>No contact found.</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {filteredContacts.map((contact) => (
                                      <CommandItem
                                        key={contact.id}
                                        value={`${contact.first_name} ${contact.last_name}`}
                                        onSelect={() => {
                                          form.setValue("contact_id", contact.id);
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
                    </div>
                  </div>

                  {/* Project Owner */}
                  <FormField
                    control={form.control}
                    name="owner_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Owner *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTypeId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {owners.map((owner) => (
                              <SelectItem key={owner.id} value={owner.id}>
                                {owner.full_name || owner.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Timeline</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    disabled={!selectedTypeId}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
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
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="target_end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Target End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    disabled={!selectedTypeId}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
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
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Development-specific fields */}
                  {isDevelopmentProject && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-sm font-medium text-foreground">Development Details</h3>
                      
                      <FormField
                        control={form.control}
                        name="tech_stack"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tech Stack</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="React, Node.js, PostgreSQL..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="repository_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repository URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://github.com/..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="staging_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Staging URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://staging.example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="production_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Production URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <SheetFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !selectedTypeId}>
                  {isSubmitting ? "Saving..." : isEditMode ? "Update Project" : "Create Project"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
