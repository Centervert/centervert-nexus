import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContact, useLinkContact, PhoneNumber } from "@/hooks/useContacts";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId?: string;
}

const CreateContactDialog = ({ open, onOpenChange, opportunityId }: CreateContactDialogProps) => {
  const { register, handleSubmit, reset, setValue } = useForm();
  const createContact = useCreateContact();
  const linkContact = useLinkContact();
  const { user } = useAuth();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([{ number: "", type: "Mobile" }]);

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const onSubmit = async (data: any) => {
    const validPhones = phoneNumbers.filter((p) => p.number.trim() !== "");
    const contactData = {
      ...data,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name} ${data.last_name}`,
      phone: validPhones[0]?.number || null,
      phone_numbers: validPhones,
      status: 'active',
      created_by: user?.id,
    };

    const newContact = await createContact.mutateAsync(contactData);
    if (opportunityId && newContact) {
      await linkContact.mutateAsync({ opportunity_id: opportunityId, contact_id: newContact.id });
    }
    reset();
    setPhoneNumbers([{ number: "", type: "Mobile" }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create New Contact</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name *</Label><Input {...register("first_name", { required: true })} /></div>
            <div><Label>Last Name *</Label><Input {...register("last_name", { required: true })} /></div>
          </div>
          <div><Label>Email *</Label><Input type="email" {...register("email", { required: true })} /></div>
          <div><Label>Organization</Label><Input {...register("organization")} /></div>
          <div><Label>Title</Label><Input {...register("title")} /></div>
          <div><Label>Notes</Label><Textarea {...register("notes")} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create Contact</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContactDialog;
