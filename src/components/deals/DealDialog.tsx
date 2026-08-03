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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemperatureSlider } from "./TemperatureSlider";
import { DEAL_STAGES, PROFILES } from "@/lib/meddpicc";

const STAGES = DEAL_STAGES;

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  owner_id: z.string().optional(),
  temperature: z.number().min(0).max(10),
  stage: z.enum([
    "discovery",
    "qualified",
    "solution_fit",
    "preferred_vendor",
    "commercial",
    "commit",
    "on_hold",
    "won",
    "lost",
  ]),
  methodology_profile: z.enum(["full", "standard", "lite"]),
  organization_id: z.string().optional(),
  contact_id: z.string().optional(),
  expected_value: z.string().optional(),
  description: z.string().optional(),
  lost_reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Deal {
  id: string;
  name: string;
  owner_id: string | null;
  temperature: number;
  description: string | null;
  status: string;
  stage?: string;
  methodology_profile?: string | null;
  organization_id: string | null;
  contact_id: string | null;
  expected_value: number | null;
  lost_reason?: string | null;
}

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (dealId?: string) => void;
  deal?: Deal | null;
  initialValues?: Partial<FormData>;
  prospectId?: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface Organization {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  organization_id: string | null;
}

export function DealDialog({ open, onOpenChange, onSuccess, deal, initialValues, prospectId }: DealDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<Profile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      owner_id: undefined,
      temperature: 5,
      stage: "discovery",
      methodology_profile: "full",
      organization_id: undefined,
      contact_id: undefined,
      expected_value: "",
      description: "",
      lost_reason: "",
    },
  });

  const selectedOrgId = form.watch("organization_id");
  const selectedStage = form.watch("stage");

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (deal && open) {
      form.reset({
        name: deal.name,
        owner_id: deal.owner_id || undefined,
        temperature: deal.temperature,
        stage: (deal.stage as any) || "discovery",
        methodology_profile: (deal.methodology_profile as any) || "full",
        organization_id: deal.organization_id || undefined,
        contact_id: deal.contact_id || undefined,
        expected_value: deal.expected_value?.toString() || "",
        description: deal.description || "",
        lost_reason: deal.lost_reason || "",
      });
    } else if (!deal && open) {
      form.reset({
        name: initialValues?.name ?? "",
        owner_id: initialValues?.owner_id,
        temperature: initialValues?.temperature ?? 5,
        stage: initialValues?.stage ?? "discovery",
        methodology_profile: initialValues?.methodology_profile ?? "full",
        organization_id: initialValues?.organization_id,
        contact_id: initialValues?.contact_id,
        expected_value: initialValues?.expected_value ?? "",
        description: initialValues?.description ?? "",
        lost_reason: "",
      });
    }
  }, [deal, open, form, initialValues]);

  const loadData = async () => {
    const [ownersRes, orgsRes, contactsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("is_active", true),
      supabase.from("organizations").select("id, name").eq("is_active", true).order("name"),
      supabase.from("contacts").select("id, first_name, last_name, organization_id").order("first_name"),
    ]);

    if (ownersRes.data) setOwners(ownersRes.data);
    if (orgsRes.data) setOrganizations(orgsRes.data);
    if (contactsRes.data) setContacts(contactsRes.data);
  };

  const filteredContacts = selectedOrgId 
    ? contacts.filter(c => c.organization_id === selectedOrgId)
    : contacts;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const dealData = {
        name: data.name,
        owner_id: data.owner_id || userData.user.id,
        temperature: data.temperature,
        stage: data.stage as any,
        methodology_profile: data.methodology_profile,
        lost_reason: data.stage === "lost" ? (data.lost_reason || null) : null,
        organization_id: data.organization_id || null,
        contact_id: data.contact_id || null,
        expected_value: data.expected_value ? parseFloat(data.expected_value) : null,
        description: data.description || null,
      };

      if (deal) {
        const { error } = await supabase
          .from("deals")
          .update(dealData)
          .eq("id", deal.id);
        if (error) throw error;
        toast({ title: "Deal updated successfully" });
        onSuccess(deal.id);
      } else {
        const { data: inserted, error } = await supabase
          .from("deals")
          .insert({ ...dealData, created_by: userData.user.id, prospect_id: prospectId ?? null })
          .select("id")
          .single();
        if (error) throw error;
        toast({ title: "Deal created successfully" });
        onSuccess(inserted?.id);
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{deal ? "Edit Deal" : "New Deal"}</SheetTitle>
          <SheetDescription>
            {deal ? "Update the deal details." : "Add a new deal to track."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Deal name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
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

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature</FormLabel>
                  <FormControl>
                    <TemperatureSlider
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="methodology_profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification profile</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROFILES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStage === "lost" && (
              <FormField
                control={form.control}
                name="lost_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lost Reason *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Why was this deal lost?" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredContacts.map((contact) => (
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
              name="expected_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Value</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-7"
                        {...field} 
                      />
                    </div>
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
                    <Textarea 
                      placeholder="Brief notes about this deal..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : deal ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
