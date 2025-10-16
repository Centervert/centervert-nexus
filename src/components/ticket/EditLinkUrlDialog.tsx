import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface EditLinkUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkId: string;
  currentUrl: string | null;
  linkTitle: string;
  onSuccess: () => void;
}

export const EditLinkUrlDialog = ({
  open,
  onOpenChange,
  linkId,
  currentUrl,
  linkTitle,
  onSuccess,
}: EditLinkUrlDialogProps) => {
  const [url, setUrl] = useState(currentUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!url.trim()) {
      toast({
        title: 'Error',
        description: 'URL cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ticket_links')
        .update({ url: url.trim() })
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'URL updated successfully',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to update URL. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit URL</DialogTitle>
          <DialogDescription>
            Update the URL for {linkTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
