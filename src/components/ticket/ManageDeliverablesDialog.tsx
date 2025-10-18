import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DELIVERABLE_TEMPLATES, LINK_TYPES } from '@/types/deliverables';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Plus, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customType, setCustomType] = useState('reference');

  const handleAddCustomLink = async () => {
    if (!customTitle.trim() || !customUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both title and URL',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('ticket_links')
        .insert({
          ticket_id: ticketId,
          title: customTitle.trim(),
          url: customUrl.trim(),
          link_type: customType,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Link added successfully',
      });

      setCustomTitle('');
      setCustomUrl('');
      setCustomType('reference');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding link:', error);
      toast({
        title: 'Error',
        description: 'Failed to add link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

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

      const { error: linksError } = await supabase
        .from('ticket_links')
        .insert(linksToInsert);

      if (linksError) throw linksError;

      // Create milestone entries for each deliverable
      const milestonesToInsert = template.links.map(link => ({
        ticket_id: ticketId,
        title: `${link.title} Added`,
        description: `${link.title} deliverable has been added to the project`,
        type: 'deliverable',
        status: 'pending',
      }));

      const { error: milestonesError } = await supabase
        .from('ticket_milestones')
        .insert(milestonesToInsert);

      if (milestonesError) throw milestonesError;

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Project Links</DialogTitle>
          <DialogDescription>
            Add supporting links, deliverables, or reference materials
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">
              <LinkIcon className="h-4 w-4 mr-2" />
              Add Custom Link
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Plus className="h-4 w-4 mr-2" />
              Use Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-title">Link Title</Label>
                <Input
                  id="link-title"
                  placeholder="e.g., Brand Guidelines, Google Drive Folder"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-type">Link Type</Label>
                <Select value={customType} onValueChange={setCustomType}>
                  <SelectTrigger id="link-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddCustomLink}
                disabled={isAdding || !customTitle.trim() || !customUrl.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <div className="grid gap-4">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
