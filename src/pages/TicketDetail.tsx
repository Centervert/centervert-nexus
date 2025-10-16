import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Building2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          categories (
            name
          ),
          creator:profiles!tickets_created_by_fkey (
            full_name,
            email,
            company
          ),
          assigned_profile:profiles!tickets_assigned_to_fkey (
            full_name,
            email,
            company
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      open: { label: 'New Request', className: 'bg-gray-900 text-white' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      awaiting_response: { label: 'Awaiting Your Response', className: 'bg-yellow-500 text-white' },
      closed: { label: 'Awaiting Finance Approval', className: 'bg-purple-100 text-purple-800' },
      resolved: { label: 'Complete', className: 'bg-green-100 text-green-800' },
    };
    return statusMap[status] || { label: status, className: 'bg-gray-500 text-white' };
  };

  const getPriorityDisplay = (priority: string) => {
    const priorityMap: Record<string, { className: string }> = {
      urgent: { className: 'text-red-600 font-semibold' },
      high: { className: 'text-orange-600 font-semibold' },
      medium: { className: 'text-yellow-600' },
      low: { className: 'text-green-600' },
    };
    return priorityMap[priority] || { className: 'text-gray-600' };
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
              <SidebarTrigger className="md:hidden" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-4 md:p-8 space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!ticket) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
              <SidebarTrigger className="md:hidden" />
            </div>
            <div className="p-4 md:p-8">
              <p className="text-center text-muted-foreground">Ticket not found</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const statusDisplay = getStatusDisplay(ticket.status);
  const priorityDisplay = getPriorityDisplay(ticket.priority);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tickets
            </Button>
          </div>

          <div className="p-4 md:p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{ticket.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>#{ticket.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span className={priorityDisplay.className}>
                      {ticket.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                </div>
                <Badge className={cn('rounded-md px-4 py-2 text-sm font-medium', statusDisplay.className)}>
                  {statusDisplay.label}
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {ticket.description || 'No description provided'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No activity yet
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ticket Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Client</p>
                        <p className="text-sm font-medium">
                          {ticket.creator?.company || ticket.creator?.full_name || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Created By</p>
                        <p className="text-sm font-medium">
                          {ticket.creator?.full_name || ticket.creator?.email || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                        <p className="text-sm font-medium">
                          {ticket.assigned_profile?.full_name || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="text-sm font-medium">
                          {ticket.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Created</p>
                        <p className="text-sm font-medium">
                          {new Date(ticket.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TicketDetail;
