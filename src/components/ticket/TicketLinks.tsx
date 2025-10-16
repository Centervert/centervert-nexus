import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const { data: links = [], isLoading } = useQuery({
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

  if (links.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Project Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{link.title}</p>
                  {link.url ? (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {link.url}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not yet available</p>
                  )}
                </div>
              </div>
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
