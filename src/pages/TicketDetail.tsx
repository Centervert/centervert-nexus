import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TicketDetails } from '@/components/ticket/TicketDetails';
import { TicketUpdates } from '@/components/ticket/TicketUpdates';
import { TicketMilestones } from '@/components/ticket/TicketMilestones';
import { TicketPricing } from '@/components/ticket/TicketPricing';
import { TicketLinks } from '@/components/ticket/TicketLinks';
import { TicketFiles } from '@/components/ticket/TicketFiles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        .maybeSingle();

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

  const statusOptions: Array<{
    value: 'open' | 'in_progress' | 'awaiting_response' | 'resolved' | 'closed';
    label: string;
    className: string;
  }> = [
    { value: 'open', label: 'New Request', className: 'bg-gray-900 text-white' },
    { value: 'in_progress', label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
    { value: 'awaiting_response', label: 'Awaiting Your Response', className: 'bg-yellow-500 text-white' },
    { value: 'closed', label: 'Awaiting Finance Approval', className: 'bg-purple-100 text-purple-800' },
    { value: 'resolved', label: 'Complete', className: 'bg-green-100 text-green-800' },
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: 'open' | 'in_progress' | 'awaiting_response' | 'resolved' | 'closed') => {
      // Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const userName = profile?.full_name || user.email || 'Unknown User';
      
      // Get current ticket status before updating
      const { data: currentTicket } = await supabase
        .from('tickets')
        .select('status')
        .eq('id', id)
        .single();

      const oldStatus = currentTicket?.status;
      const oldStatusLabel = statusOptions.find(opt => opt.value === oldStatus)?.label || oldStatus;
      const newStatusLabel = statusOptions.find(opt => opt.value === newStatus)?.label || newStatus;

      // Update ticket status
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (ticketError) throw ticketError;

      // Create milestone for status change
      const { error: milestoneError } = await supabase
        .from('ticket_milestones')
        .insert({
          ticket_id: id,
          type: 'status_change',
          title: `${userName} updated the status from ${oldStatusLabel} to ${newStatusLabel}`,
          status: 'completed'
        });

      if (milestoneError) throw milestoneError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast({
        title: 'Status updated',
        description: 'Ticket status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update ticket status.',
        variant: 'destructive',
      });
      console.error('Error updating status:', error);
    },
  });

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
              Back to Dashboard
            </Button>
            {!isLoading && ticket && (
              <span className="text-sm text-muted-foreground">
                Ticket #{ticket.ticket_number || ticket.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {/* Title & Status */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold flex-1">{ticket.title}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'rounded-md px-4 py-2 text-sm font-medium shrink-0 gap-2',
                      statusDisplay.className
                    )}
                  >
                    {statusDisplay.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => updateStatusMutation.mutate(option.value)}
                      className="cursor-pointer"
                    >
                      <Badge className={cn('rounded-md px-3 py-1 text-xs font-medium w-full justify-center', option.className)}>
                        {option.label}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Main Content Sections */}
            <div className="space-y-6">
              <TicketDetails ticket={ticket} />

              {/* Description */}
              {ticket.description && (
                <div className="bg-card border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-3">Description</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* Two-column layout for chat and milestones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TicketUpdates ticketId={ticket.id} />
                <TicketMilestones ticketId={ticket.id} />
              </div>

              {/* Pricing section */}
              <TicketPricing ticketId={ticket.id} />

              {/* Links and Files */}
              <TicketLinks ticketId={ticket.id} />
              <TicketFiles ticketId={ticket.id} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TicketDetail;
