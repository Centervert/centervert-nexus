import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Link as LinkIcon, Settings, Pencil, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useState } from 'react';
import { ManageDeliverablesDialog } from './ManageDeliverablesDialog';
import { EditLinkUrlDialog } from './EditLinkUrlDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface TicketLink {
  id: string;
  title: string;
  url: string | null;
  link_type: string;
}

interface TicketLinksProps {
  ticketId: string;
}

export const TicketLinks = ({ ticketId }: TicketLinksProps) => {
  const { data: userRole } = useUserRole();
  const isAdminOrAgent = userRole?.isAdmin || userRole?.isAgent;
  
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<TicketLink | null>(null);
  
  const { data: links = [], isLoading, refetch } = useQuery({
    queryKey: ['ticket-links', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_links')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as TicketLink[];
    },
  });

  const handleVisitLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEditLink = (link: TicketLink) => {
    setSelectedLink(link);
    setEditDialogOpen(true);
  };

  const handleDeleteLink = (link: TicketLink) => {
    setSelectedLink(link);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLink) return;

    try {
      const { error } = await supabase
        .from('ticket_links')
        .delete()
        .eq('id', selectedLink.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Link deleted successfully',
      });

      refetch();
      setDeleteDialogOpen(false);
      setSelectedLink(null);
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getLinkTypeBadgeVariant = (linkType: string) => {
    switch (linkType.toLowerCase()) {
      case 'demo':
        return 'default';
      case 'production':
        return 'secondary';
      case 'staging':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Project Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading links...</p>
        </CardContent>
      </Card>
    );
  }

  // Hide card completely for non-admin users when there are no links
  if (links.length === 0 && !isAdminOrAgent) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 flex-1">
              <LinkIcon className="h-5 w-5" />
              Project Links
            </CardTitle>
            {isAdminOrAgent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManageDialogOpen(true)}
                className="self-start sm:self-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Manage Deliverables</span>
                <span className="sm:hidden">Manage</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No deliverables added yet. Click "Manage Deliverables" to add them.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {links.map((link) => (
              <div
                key={link.id}
                className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium">{link.title}</p>
                      <Badge variant={getLinkTypeBadgeVariant(link.link_type)}>
                        {link.link_type}
                      </Badge>
                    </div>
                    {link.url ? (
                      <a
                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {link.url}
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not yet available</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-start">
                  {link.url ? (
                    <Button
                      onClick={() => handleVisitLink(link.url!)}
                      size="sm"
                      variant="outline"
                    >
                      Visit
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled>
                      Coming Soon
                    </Button>
                  )}
                  {isAdminOrAgent && (
                    <>
                      <Button
                        onClick={() => handleEditLink(link)}
                        size="sm"
                        variant="ghost"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteLink(link)}
                        size="sm"
                        variant="ghost"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ManageDeliverablesDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        ticketId={ticketId}
        onSuccess={refetch}
      />

      {selectedLink && (
        <>
          <EditLinkUrlDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            linkId={selectedLink.id}
            currentUrl={selectedLink.url}
            linkTitle={selectedLink.title}
            onSuccess={refetch}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Link</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{selectedLink.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
};
