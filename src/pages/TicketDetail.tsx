import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ChevronDown, Pencil, X, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TicketDetails } from '@/components/ticket/TicketDetails';
import { TicketUpdates } from '@/components/ticket/TicketUpdates';
import { TicketMilestones } from '@/components/ticket/TicketMilestones';
import { TicketPricing } from '@/components/ticket/TicketPricing';
import { TicketLinks } from '@/components/ticket/TicketLinks';
import { TicketFiles } from '@/components/ticket/TicketFiles';
import { CreateQuoteDialog } from '@/components/ticket/CreateQuoteDialog';
import { ConvertToManagedServiceDialog } from '@/components/ticket/ConvertToManagedServiceDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useState } from 'react';
import { toast } from 'sonner';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  const queryClient = useQueryClient();
  const { data: userRole } = useUserRole();
  const [isEditing, setIsEditing] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editType, setEditType] = useState('');
  const [editSubtype, setEditSubtype] = useState('');
  const [editEndClientName, setEditEndClientName] = useState('');

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
      
      // Initialize edit form when ticket loads
      if (data) {
        setEditTitle(data.title);
        setEditDescription(data.description || '');
        setEditPriority(data.priority);
        setEditCategoryId(data.category_id || 'none');
        setEditAssignedTo(data.assigned_to || 'unassigned');
        setEditDueDate(data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : '');
        setEditBudget(data.budget?.toString() || '');
        setEditType(data.type || '');
        setEditSubtype(data.subtype || '');
        setEditEndClientName(data.end_client_name || '');
      }
      
      return data;
    },
    enabled: !!id,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch available agents
  const { data: agents } = useQuery({
    queryKey: ['available-agents'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_agents');
      if (error) throw error;
      return data;
    },
  });

  // Fetch ticket quotes for conversion
  const { data: ticketQuote } = useQuery({
    queryKey: ['ticket-quote', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_quotes')
        .select('id, amount, deliverables, billing_interval, is_recurring')
        .eq('ticket_id', id)
        .eq('status', 'approved')
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
      toastHook({
        title: 'Status updated',
        description: 'Ticket status has been updated successfully.',
      });
    },
    onError: (error) => {
      toastHook({
        title: 'Error',
        description: 'Failed to update ticket status.',
        variant: 'destructive',
      });
      console.error('Error updating status:', error);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        type: editType || null,
        subtype: editSubtype || null,
        end_client_name: editEndClientName || null,
      };

      if (editCategoryId && editCategoryId !== 'none') updates.category_id = editCategoryId;
      else updates.category_id = null;
      
      if (editAssignedTo && editAssignedTo !== 'unassigned') updates.assigned_to = editAssignedTo;
      else updates.assigned_to = null;
      
      if (editDueDate) updates.due_date = editDueDate;
      if (editBudget) updates.budget = parseFloat(editBudget);

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update ticket');
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
            {/* Title, Status, and Admin Actions */}
            {isEditing && userRole?.isAdmin ? (
              // Edit Mode
              <div className="space-y-6 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Edit Ticket</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form
                        if (ticket) {
                          setEditTitle(ticket.title);
                          setEditDescription(ticket.description || '');
                          setEditPriority(ticket.priority);
                          setEditCategoryId(ticket.category_id || 'none');
                          setEditAssignedTo(ticket.assigned_to || 'unassigned');
                          setEditDueDate(ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : '');
                          setEditBudget(ticket.budget?.toString() || '');
                          setEditType(ticket.type || '');
                          setEditSubtype(ticket.subtype || '');
                          setEditEndClientName(ticket.end_client_name || '');
                        }
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateTicketMutation.mutate()}
                      disabled={updateTicketMutation.isPending}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {updateTicketMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 bg-card border rounded-lg p-6">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select value={editPriority} onValueChange={setEditPriority}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-assigned">Assigned To</Label>
                      <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {agents?.map((agent: any) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.full_name || agent.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-due-date">Due Date</Label>
                      <Input
                        id="edit-due-date"
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-end-client">End Client</Label>
                    <Input
                      id="edit-end-client"
                      value={editEndClientName}
                      onChange={(e) => setEditEndClientName(e.target.value)}
                      placeholder="Client or company name"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-type">Type</Label>
                      <Select value={editType || "none"} onValueChange={(val) => setEditType(val === "none" ? "" : val)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Bug">Bug</SelectItem>
                          <SelectItem value="Feature">Feature</SelectItem>
                          <SelectItem value="Enhancement">Enhancement</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Documentation">Documentation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-subtype">Subtype</Label>
                      <Select value={editSubtype || "none"} onValueChange={(val) => setEditSubtype(val === "none" ? "" : val)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select subtype" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="UI">UI</SelectItem>
                          <SelectItem value="Backend">Backend</SelectItem>
                          <SelectItem value="Database">Database</SelectItem>
                          <SelectItem value="API">API</SelectItem>
                          <SelectItem value="Performance">Performance</SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-budget">Budget ($)</Label>
                    <Input
                      id="edit-budget"
                      type="number"
                      step="0.01"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{ticket.title}</h1>
                  {ticket.managed_service_id && (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-green-600 gap-2"
                      onClick={() => navigate(`/managed-services/${ticket.managed_service_id}`)}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Active Managed Service
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {userRole?.isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      {ticket.status === 'resolved' && !ticket.managed_service_id && ticket.client_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setConvertDialogOpen(true)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Convert to Managed Service
                        </Button>
                      )}
                      <CreateQuoteDialog ticketId={ticket.id} />
                    </>
                  )}
                  {userRole?.isAdmin ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'rounded-md px-4 py-2 text-sm font-medium gap-2',
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
                  ) : (
                    <Badge className={cn('rounded-md px-4 py-2 text-sm font-medium', statusDisplay.className)}>
                      {statusDisplay.label}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Main Content Sections */}
            <div className="space-y-6">
              {!isEditing && <TicketDetails ticket={ticket} />}

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

            {/* Convert to Managed Service Dialog */}
            {userRole?.isAdmin && ticket.status === 'resolved' && !ticket.managed_service_id && (
              <ConvertToManagedServiceDialog
                open={convertDialogOpen}
                onOpenChange={setConvertDialogOpen}
                ticketId={ticket.id}
                ticketTitle={ticket.title}
                clientId={ticket.client_id}
                resolvedAt={ticket.resolved_at}
                quoteData={ticketQuote && ticketQuote.is_recurring ? {
                  amount: Number(ticketQuote.amount),
                  deliverables: ticketQuote.deliverables,
                  billing_interval: ticketQuote.billing_interval,
                } : undefined}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TicketDetail;
