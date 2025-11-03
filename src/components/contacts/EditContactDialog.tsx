import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateContact, type Contact } from '@/hooks/useContacts';

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
}

const EditContactDialog = ({ open, onOpenChange, contact }: EditContactDialogProps) => {
  const { register, handleSubmit, reset, setValue } = useForm();
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (contact) {
      reset({
        full_name: contact.full_name,
        title: contact.title,
        email: contact.email,
        phone: contact.phone,
        phone_extension: contact.phone_extension,
        organization: contact.organization,
        contact_type: contact.contact_type,
        notes: contact.notes,
      });
      if (contact.contact_type) {
        setValue('contact_type', contact.contact_type);
      }
    }
  }, [contact, reset, setValue]);

  const onSubmit = async (data: any) => {
    if (!contact) return;

    updateContact.mutate(
      {
        id: contact.id,
        updates: data,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" {...register('full_name', { required: true })} />
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register('phone')} placeholder="(555) 555-5555" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_extension">Phone Extension</Label>
              <Input id="phone_extension" {...register('phone_extension')} placeholder="e.g., 1234" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input id="organization" {...register('organization')} />
            </div>

            <div>
              <Label htmlFor="contact_type">Contact Type</Label>
              <Select
                defaultValue={contact.contact_type || undefined}
                onValueChange={(value) => setValue('contact_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="decision_maker">Decision Maker</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateContact.isPending}>
              {updateContact.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContactDialog;
