import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DELIVERABLE_TEMPLATES } from '@/types/deliverables';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Plus } from 'lucide-react';

interface ManageDeliverablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  onSuccess: () => void;
}

export const ManageDeliverablesDialog = ({
  open,
  onOpenChange,
  ticketId,
  onSuccess,
}: ManageDeliverablesDialogProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTemplate = async (templateId: string) => {
    const template = DELIVERABLE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setIsAdding(true);
    try {
      const linksToInsert = template.links.map(link => ({
        ticket_id: ticketId,
        title: link.title,
        link_type: link.link_type,
        url: null,
      }));

      const { error } = await supabase
        .from('ticket_links')
        .insert(linksToInsert);

      if (error) throw error;

      toast({
        title: 'Deliverables Added',
        description: `Added ${template.links.length} deliverable links: ${template.links.map(l => l.title).join(', ')}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding deliverables:', error);
      toast({
        title: 'Error',
        description: 'Failed to add deliverables. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Deliverables</DialogTitle>
          <DialogDescription>
            Choose a deliverable template to add to this ticket
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {DELIVERABLE_TEMPLATES.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Will add:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {template.links.map((link, idx) => (
                        <li key={idx}>{link.title}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    onClick={() => handleAddTemplate(template.id)}
                    disabled={isAdding}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
