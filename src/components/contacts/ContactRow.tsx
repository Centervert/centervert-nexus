import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phoneUtils";
import { EditableCell } from "./EditableCell";
import { EditableSelectCell } from "./EditableSelectCell";

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
  isSelected?: boolean;
  onSelectChange?: (id: string, selected: boolean) => void;
}

export function ContactRow({ contact, onDelete, isSelected = false, onSelectChange }: ContactRowProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: companies } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data, error} = await supabase
        .from("organizations")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const updateField = async (field: string, value: any) => {
    try {
      const updateData: any = {};
      if (field === "phone") {
        updateData[field] = normalizePhoneNumber(value) || null;
      } else {
        updateData[field] = value || null;
      }

      const { error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", contact.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["company-contacts"] });
      toast({ title: "Contact updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <TableRow className={isSelected ? "bg-muted/50" : ""}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange?.(contact.id, checked === true)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`${getAvatarColor(contact.first_name)} text-white text-xs`}>
              {getInitials(contact.first_name, contact.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/contacts/${contact.id}`)}
              className="font-medium text-primary hover:underline"
            >
              {contact.first_name} {contact.last_name}
            </button>
            {contact.is_primary && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <EditableCell
          value={contact.email}
          onSave={(value) => updateField("email", value)}
          type="email"
          placeholder="--"
        />
      </TableCell>
      <TableCell>
        <EditableCell
          value={contact.phone}
          displayValue={contact.phone ? formatPhoneNumber(contact.phone) : undefined}
          onSave={(value) => updateField("phone", value)}
          type="tel"
          placeholder="--"
          className="text-sm"
        />
      </TableCell>
      <TableCell>
        <EditableSelectCell
          value={contact.company_id}
          onSave={(value) => updateField("company_id", value)}
          options={companies || []}
          placeholder="--"
          onValueClick={(id) => navigate(`/companies/${id}`)}
        />
      </TableCell>
      <TableCell>
        <EditableCell
          value={contact.title}
          onSave={(value) => updateField("title", value)}
          placeholder="--"
        />
      </TableCell>
    </TableRow>
  );
}
