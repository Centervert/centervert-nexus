import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Mail, Phone, Star, Check, X } from "lucide-react";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phoneUtils";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  company_id: string | null;
  notes: string | null;
  is_primary: boolean | null;
  companies: {
    name: string;
  } | null;
}

interface ContactRowProps {
  contact: Contact;
  onDelete: (id: string) => void;
}

export function ContactRow({ contact, onDelete }: ContactRowProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);

  const { data: companies } = useQuery({
    queryKey: ["companies-list"],
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

  const updateMutation = useMutation({
    mutationFn: async (values: typeof editedContact) => {
      const { error } = await supabase
        .from("contacts")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: normalizePhoneNumber(values.phone) || null,
          title: values.title || null,
          company_id: values.company_id || null,
        })
        .eq("id", contact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["company-contacts"] });
      toast({ title: "Contact updated successfully" });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editedContact.first_name || !editedContact.last_name || !editedContact.email) {
      toast({
        title: "Validation error",
        description: "First name, last name, and email are required",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(editedContact);
  };

  const handleCancel = () => {
    setEditedContact(contact);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <div className="flex gap-2">
            <Input
              value={editedContact.first_name}
              onChange={(e) =>
                setEditedContact({ ...editedContact, first_name: e.target.value })
              }
              placeholder="First name"
              className="h-8"
            />
            <Input
              value={editedContact.last_name}
              onChange={(e) =>
                setEditedContact({ ...editedContact, last_name: e.target.value })
              }
              placeholder="Last name"
              className="h-8"
            />
          </div>
        </TableCell>
        <TableCell>
          <Select
            value={editedContact.company_id || "none"}
            onValueChange={(value) =>
              setEditedContact({
                ...editedContact,
                company_id: value === "none" ? null : value,
              })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No company</SelectItem>
              {companies?.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <div className="space-y-2">
            <Input
              type="email"
              value={editedContact.email}
              onChange={(e) =>
                setEditedContact({ ...editedContact, email: e.target.value })
              }
              placeholder="Email"
              className="h-8"
            />
            <Input
              value={editedContact.phone || ""}
              onChange={(e) =>
                setEditedContact({ ...editedContact, phone: e.target.value || null })
              }
              placeholder="Phone"
              className="h-8"
            />
          </div>
        </TableCell>
        <TableCell>
          <Input
            value={editedContact.title || ""}
            onChange={(e) =>
              setEditedContact({ ...editedContact, title: e.target.value || null })
            }
            placeholder="Title"
            className="h-8"
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {contact.first_name} {contact.last_name}
          </span>
          {contact.is_primary && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
        </div>
      </TableCell>
      <TableCell>
        {contact.companies && contact.company_id ? (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            onClick={() => navigate(`/companies/${contact.company_id}`)}
          >
            {contact.companies.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No company</span>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{contact.email}</span>
          </div>
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{formatPhoneNumber(contact.phone)}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{contact.title || "—"}</span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(contact.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
