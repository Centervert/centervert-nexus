import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateContact, Contact } from "@/hooks/useContacts";

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

const EditContactDialog = ({ open, onOpenChange, contact }: EditContactDialogProps) => {
  const { register, handleSubmit, reset, setValue } = useForm();
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (contact) {
      setValue("first_name", contact.first_name);
      setValue("last_name", contact.last_name);
      setValue("email", contact.email);
      setValue("organization", contact.organization);
      setValue("title", contact.title);
      setValue("notes", contact.notes);
    }
  }, [contact, setValue]);

  const onSubmit = async (data: any) => {
    await updateContact.mutateAsync({ 
      id: contact.id, 
      updates: { ...data, full_name: `${data.first_name} ${data.last_name}` } 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name *</Label><Input {...register("first_name", { required: true })} /></div>
            <div><Label>Last Name *</Label><Input {...register("last_name", { required: true })} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" {...register("email")} /></div>
          <div><Label>Organization</Label><Input {...register("organization")} /></div>
          <div><Label>Title</Label><Input {...register("title")} /></div>
          <div><Label>Notes</Label><Textarea {...register("notes")} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContactDialog;
