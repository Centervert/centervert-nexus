import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ExternalLink, Trash2, Plus, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';

interface OpportunityWorkingLinksProps {
  opportunityId: string;
}

const linkSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  url: z.string().trim().url('Must be a valid URL').max(2000, 'URL must be less than 2000 characters'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
});

type LinkFormData = z.infer<typeof linkSchema>;

const OpportunityWorkingLinks = ({ opportunityId }: OpportunityWorkingLinksProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    url: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LinkFormData, string>>>({});

  const { data: links, isLoading } = useQuery({
    queryKey: ['opportunity-working-links', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_document_links')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createLink = useMutation({
    mutationFn: async (data: LinkFormData) => {
      const { error } = await supabase
        .from('opportunity_document_links')
        .insert([{
          opportunity_id: opportunityId,
          title: data.title,
          url: data.url,
          description: data.description || null,
          created_by: user?.id,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-working-links', opportunityId] });
      toast.success('Link added');
      setAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to add link');
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LinkFormData }) => {
      const { error } = await supabase
        .from('opportunity_document_links')
        .update({
          title: data.title,
          url: data.url,
          description: data.description || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-working-links', opportunityId] });
      toast.success('Link updated');
      setEditingId(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update link');
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunity_document_links')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-working-links', opportunityId] });
      toast.success('Link deleted');
    },
    onError: () => {
      toast.error('Failed to delete link');
    },
  });

  const resetForm = () => {
    setFormData({ title: '', url: '', description: '' });
    setErrors({});
  };

  const validateForm = (): boolean => {
    try {
      linkSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LinkFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LinkFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingId) {
      updateLink.mutate({ id: editingId, data: formData });
    } else {
      createLink.mutate(formData);
    }
  };

  const startEditing = (link: any) => {
    setEditingId(link.id);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
    });
    setAddDialogOpen(true);
  };

  const cancelDialog = () => {
    setAddDialogOpen(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Working Document Links</h3>
            <p className="text-sm text-muted-foreground">Add links to Google Docs, Dropbox, and other cloud files</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading links...</p>
          ) : links?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No working links added yet</p>
          ) : (
            links?.map((link) => (
              <div
                key={link.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      {link.title}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                  {link.description && (
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Added {format(new Date(link.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(link)}
                    title="Edit link"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLink.mutate(link.id)}
                    title="Delete link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add/Edit Link Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => !open && cancelDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Link' : 'Add Working Document Link'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="e.g., Project Proposal Draft"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL *</label>
              <Input
                type="url"
                placeholder="https://docs.google.com/..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                maxLength={2000}
              />
              {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                placeholder="Brief description of the document"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                maxLength={500}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createLink.isPending || updateLink.isPending}
            >
              {editingId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OpportunityWorkingLinks;
