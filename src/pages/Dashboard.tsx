import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Filter, ArrowUpDown, Ticket as TicketIcon, MessageSquare, Clock, FileText, ChevronDown, ChevronRight, Sparkles, Trash2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTickets, useTicketStats, Ticket } from '@/hooks/useTickets';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AITicketDialog } from '@/components/ticket/AITicketDialog';
import { CreateTicketDialog } from '@/components/ticket/CreateTicketDialog';
import { FinancialStats } from '@/components/FinancialStats';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [poFilter, setPoFilter] = useState<'all' | 'with_po' | 'without_po'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'priority' | 'status' | 'client' | 'due_date'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('open');
  const [expandedTickets, setExpandedTickets] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const { data: userRole } = useUserRole();

  // Set default sort to due_date for admins
  if (userRole?.isAdmin && sortBy === 'created_at' && sortDirection === 'desc') {
    setSortBy('due_date');
    setSortDirection('asc');
  }

  const { data: tickets, isLoading: ticketsLoading } = useTickets({
    search: searchQuery, 
    status: statusFilter,
    clientId: clientFilter,
    poStatus: poFilter,
    sortBy: sortBy === 'due_date' ? 'created_at' : sortBy, // Map due_date back to created_at for now
    sortDirection
  });
  const { data: stats, isLoading: statsLoading } = useTicketStats();

  // Fetch clients for filter dropdown (admin only)
  const { data: clients } = useQuery({
    queryKey: ['clients-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .is('deleted_at', null)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: userRole?.isAdmin,
  });

  const statusOptions = [
    { value: 'open' as const, label: 'New Request', className: 'bg-gray-900 text-white' },
    { value: 'in_progress' as const, label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
    { value: 'awaiting_response' as const, label: 'Awaiting Your Response', className: 'bg-yellow-500 text-white' },
    { value: 'pending_acknowledgment' as const, label: 'Pending Your Review', className: 'bg-amber-500 text-white' },
    { value: 'awaiting_payment' as const, label: 'Awaiting Payment', className: 'bg-purple-500 text-white' },
    { value: 'resolved' as const, label: 'Complete', className: 'bg-green-100 text-green-800' },
    { value: 'closed' as const, label: 'Completed', className: 'bg-green-600 text-white' },
  ];

  type TicketStatus = typeof statusOptions[number]['value'];

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && tickets) {
      setSelectedTickets(tickets.map(t => t.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId]);
    } else {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    }
  };

  const handleBulkDelete = async () => {
    if (!userRole?.isAdmin) {
      toast.error('Only administrators can delete tickets');
      return;
    }

    if (selectedTickets.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedTickets.length} ticket(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Smart filter: Only delete parent tickets if both parent and children are selected
      const ticketsToDelete = selectedTickets.filter(ticketId => {
        const ticket = tickets?.find(t => t.id === ticketId);
        // If this ticket is a child and its parent is also selected, skip it (parent deletion will cascade)
        if (ticket?.parent_ticket_id && selectedTickets.includes(ticket.parent_ticket_id)) {
          return false;
        }
        return true;
      });

      const { error } = await supabase
        .from('tickets')
        .delete()
        .in('id', ticketsToDelete);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      setSelectedTickets([]);
      
      toast.success(`Successfully deleted ${ticketsToDelete.length} ticket(s)`);
    } catch (error) {
      console.error('Error deleting tickets:', error);
      toast.error('Failed to delete tickets');
    }
  };

  const handleBulkStatusChange = async (newStatus: TicketStatus) => {
    if (selectedTickets.length === 0) return;

    try {
      // Smart filter: Only update parent tickets if both parent and children are selected
      const ticketsToUpdate = selectedTickets.filter(ticketId => {
        const ticket = tickets?.find(t => t.id === ticketId);
        // If this ticket is a child and its parent is also selected, skip it
        if (ticket?.parent_ticket_id && selectedTickets.includes(ticket.parent_ticket_id)) {
          return false;
        }
        return true;
      });

      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .in('id', ticketsToUpdate);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      setSelectedTickets([]);
      
      toast.success(`Successfully updated ${ticketsToUpdate.length} ticket(s)`);
    } catch (error) {
      console.error('Error updating tickets:', error);
      toast.error('Failed to update tickets');
    }
  };

  const statsCards = [
    { icon: TicketIcon, label: 'Open Tickets', value: stats?.open || '0', color: 'text-blue-600' },
    { icon: MessageSquare, label: 'Need Response', value: stats?.needResponse || '0', color: 'text-yellow-600' },
    { icon: Clock, label: 'In Progress', value: stats?.inProgress || '0', color: 'text-purple-600' },
    { icon: FileText, label: 'Total Tickets', value: stats?.total || '0', color: 'text-gray-600' },
  ];

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      open: { label: 'New Request', className: 'bg-gray-900 text-white' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      awaiting_response: { label: 'Awaiting Your Response', className: 'bg-yellow-500 text-white' },
      pending_acknowledgment: { label: 'Pending Your Review', className: 'bg-amber-500 text-white' },
      awaiting_payment: { label: 'Awaiting Payment', className: 'bg-purple-500 text-white' },
      resolved: { label: 'Complete', className: 'bg-green-100 text-green-800' },
      closed: { label: 'Completed', className: 'bg-green-600 text-white' },
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

  const getQuoteStatus = (ticket: Ticket) => {
    if (!ticket.ticket_quotes || ticket.ticket_quotes.length === 0) {
      return { label: 'No Quote', className: 'bg-gray-100 text-gray-600', needsPO: false };
    }

    const latestQuote = ticket.ticket_quotes[0];
    const needsPO = latestQuote.status === 'approved' && !latestQuote.po_number;

    if (latestQuote.status === 'awaiting_approval') {
      return { label: 'Waiting Approval', className: 'bg-yellow-100 text-yellow-800', needsPO: false };
    } else if (needsPO) {
      return { label: '⚠️ PO NEEDED', className: 'bg-red-600 text-white font-bold animate-pulse', needsPO: true };
    } else if (latestQuote.status === 'approved') {
      const amount = (latestQuote as any).amount || 0;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
      const hasManagedService = !!ticket.managed_service_id;
      const label = `Approved - ${formattedAmount}${hasManagedService ? ' +' : ''}`;
      return { label, className: 'bg-green-100 text-green-800', needsPO: false };
    } else if (latestQuote.status === 'declined') {
      return { label: 'Declined', className: 'bg-red-100 text-red-800', needsPO: false };
    }

    return { label: 'No Quote', className: 'bg-gray-100 text-gray-600', needsPO: false };
  };

  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  // Filter tickets to get parent tickets (no parent_ticket_id) and child tickets
  const parentTickets = tickets?.filter(t => !t.parent_ticket_id) || [];
  
  // Apply due_date sorting on client-side if needed
  const sortedParentTickets = sortBy === 'due_date' 
    ? [...parentTickets].sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      })
    : parentTickets;
  
  const getChildTickets = (parentId: string) => 
    tickets?.filter(t => t.parent_ticket_id === parentId) || [];

  // Helper to check if a ticket or any of its children match the active tab filter
  const ticketMatchesFilter = (ticket: Ticket, childTickets: Ticket[]) => {
    const quoteStatus = getQuoteStatus(ticket);
    
    const checkTicket = (t: Ticket, qs: ReturnType<typeof getQuoteStatus>) => {
      if (activeTab === 'open') {
        return !['resolved', 'closed'].includes(t.status);
      } else if (activeTab === 'complete') {
        return ['resolved', 'closed'].includes(t.status);
      } else if (activeTab === 'po-needed') {
        return qs.needsPO;
      }
      return true; // 'all' tab
    };

    // Check if parent matches
    if (checkTicket(ticket, quoteStatus)) return true;
    
    // Check if any child matches
    return childTickets.some(child => {
      const childQuoteStatus = getQuoteStatus(child);
      return checkTicket(child, childQuoteStatus);
    });
  };

  const renderTicketRow = (ticket: Ticket, isChild: boolean = false) => {
    const statusDisplay = getStatusDisplay(ticket.status);
    const priorityDisplay = getPriorityDisplay(ticket.priority);
    const quoteStatus = getQuoteStatus(ticket);
    const allChildTickets = getChildTickets(ticket.id);
    
    // Filter children based on active tab (same logic as parent filter)
    const childTickets = allChildTickets.filter(child => {
      const childQuoteStatus = getQuoteStatus(child);
      if (activeTab === 'open') {
        return !['resolved', 'closed'].includes(child.status);
      } else if (activeTab === 'complete') {
        return ['resolved', 'closed'].includes(child.status);
      } else if (activeTab === 'po-needed') {
        return childQuoteStatus.needsPO;
      }
      return true; // 'all' tab shows all children
    });
    
    const hasChildren = childTickets.length > 0;
    const isExpanded = expandedTickets.includes(ticket.id);

    return (
      <Collapsible key={ticket.id} open={isExpanded} onOpenChange={() => hasChildren && toggleTicketExpansion(ticket.id)}>
        <div
          className={cn(
            "p-4 hover:bg-muted/50 cursor-pointer lg:grid lg:grid-cols-[56px_minmax(200px,2fr)_minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px] lg:gap-4 lg:px-6 lg:py-4",
            isChild && "bg-muted/30 ml-8 border-l-2 border-primary/30"
          )}
        >
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-start justify-between gap-2" onClick={() => navigate(`/tickets/${ticket.id}`)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {hasChildren && (
                    <CollapsibleTrigger className="inline-flex shrink-0" onClick={(e) => {
                      e.stopPropagation();
                      toggleTicketExpansion(ticket.id);
                    }}>
                      <div className="p-1 rounded bg-primary/10 hover:bg-primary/20">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
                      </div>
                    </CollapsibleTrigger>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1 line-clamp-2 flex items-center gap-2">
                      {ticket.title}
                      {hasChildren && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          +{childTickets.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span>{parseInt(ticket.ticket_number?.toString() || '0')}</span>
                  <span>→</span>
                  <span>
                    {new Date(ticket.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ticket.categories?.name || 'Uncategorized'} • {' '}
                  <span className={priorityDisplay.className}>
                    {ticket.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <Badge className={cn('w-fit shrink-0', statusDisplay.className)}>
                {statusDisplay.label}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {ticket.client?.managing_agency?.name && ticket.client.client_type === 'agency_managed' ? (
                <div className="flex flex-wrap items-center gap-x-1">
                  <span>{ticket.client.managing_agency.name}</span>
                  <span>→</span>
                  <span className={ticket.end_client_name && 
                   ticket.end_client_name !== ticket.client.name && 
                   ticket.end_client_name !== ticket.client.managing_agency.name ? '' : 'font-semibold'}>{ticket.client.name}</span>
                  {ticket.end_client_name && 
                   ticket.end_client_name !== ticket.client.name && 
                   ticket.end_client_name !== ticket.client.managing_agency.name && (
                    <>
                      <span>→</span>
                      <span className="font-semibold">{ticket.end_client_name}</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-1">
                  <span className={ticket.end_client_name && 
                   ticket.end_client_name !== ticket.client?.name ? '' : 'font-semibold'}>{ticket.client?.name || 'No Client'}</span>
                  {ticket.end_client_name && 
                   ticket.end_client_name !== ticket.client?.name && (
                    <>
                      <span>→</span>
                      <span className="font-semibold">{ticket.end_client_name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Due: </span>
              <span className="font-medium">
                {ticket.due_date 
                  ? new Date(ticket.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <input 
              type="checkbox" 
              className="rounded border-border w-4 h-4 shrink-0" 
              checked={selectedTickets.includes(ticket.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectTicket(ticket.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {hasChildren ? (
              <CollapsibleTrigger onClick={(e) => {
                e.stopPropagation();
                toggleTicketExpansion(ticket.id);
              }}>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </CollapsibleTrigger>
            ) : (
              <div className="w-4" />
            )}
          </div>
          <div className="hidden lg:flex lg:flex-col lg:justify-center lg:min-w-0" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            <div className="font-medium leading-tight truncate">{ticket.title}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <span>{parseInt(ticket.ticket_number?.toString() || '0')}</span>
              <span>→</span>
              <span>
                {new Date(ticket.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="hidden lg:flex lg:flex-col lg:justify-center text-sm min-w-0" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            {ticket.client?.managing_agency?.name && ticket.client.client_type === 'agency_managed' ? (
              <div className="flex flex-wrap items-center gap-x-1">
                <span className="truncate max-w-[120px]">{ticket.client.managing_agency.name}</span>
                <span className="shrink-0">→</span>
                <span className={`truncate max-w-[120px] ${ticket.end_client_name && 
                 ticket.end_client_name !== ticket.client.name && 
                 ticket.end_client_name !== ticket.client.managing_agency.name ? '' : 'font-semibold'}`}>{ticket.client.name}</span>
                {ticket.end_client_name && 
                 ticket.end_client_name !== ticket.client.name && 
                 ticket.end_client_name !== ticket.client.managing_agency.name && (
                  <>
                    <span className="shrink-0">→</span>
                    <span className="truncate max-w-[120px] font-semibold">{ticket.end_client_name}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-1">
                <span className={`truncate max-w-[180px] ${ticket.end_client_name && 
                 ticket.end_client_name !== ticket.client?.name ? '' : 'font-semibold'}`}>{ticket.client?.name || 'No Client'}</span>
                {ticket.end_client_name && 
                 ticket.end_client_name !== ticket.client?.name && (
                  <>
                    <span className="shrink-0">→</span>
                    <span className="truncate max-w-[120px] font-semibold">{ticket.end_client_name}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="hidden lg:flex lg:flex-col lg:justify-center text-sm min-w-0" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            <span className="truncate text-xs text-muted-foreground">
              {ticket.assigned_profile?.full_name || 'Unassigned'}
            </span>
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-center" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            {(ticket.status === 'resolved' || ticket.status === 'pending_acknowledgment') && quoteStatus.needsPO ? (
              <Badge className={cn('rounded-md px-3 py-1.5 font-medium w-full justify-center text-xs whitespace-nowrap', quoteStatus.className)}>
                {quoteStatus.label}
              </Badge>
            ) : (
              <Badge className={cn('rounded-md px-3 py-1.5 font-medium w-full justify-center text-xs whitespace-nowrap', 
                quoteStatus.className.includes('red-600') ? 'bg-gray-100 text-gray-600' : quoteStatus.className)}>
                {quoteStatus.label.replace('⚠️ PO NEEDED', 'Approved')}
              </Badge>
            )}
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-center" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            {userRole?.isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  asChild
                >
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Badge className={cn('rounded-md px-3 py-1 text-xs font-medium', statusDisplay.className)}>
                      {statusDisplay.label}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(ticket.id, option.value);
                      }}
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
              <Badge className={cn('rounded-md px-3 py-1 text-xs font-medium', statusDisplay.className)}>
                {statusDisplay.label}
              </Badge>
            )}
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-end text-sm" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            {ticket.due_date 
              ? new Date(ticket.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A'
            }
          </div>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            {childTickets.map(childTicket => renderTicketRow(childTicket, true))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger />
            <div className="flex items-center gap-2.5 rounded-full bg-emerald-50 px-5 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">All Systems Operational</span>
            </div>
          </div>

          <div className="p-4 md:p-8">
          {/* Financial Stats - Admin Only */}
          {userRole?.isAdmin && <FinancialStats />}

          {/* Stats Cards */}
          <div className="mb-6 md:mb-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : (
              statsCards.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Pending Review Section - Only show to non-admin users */}
        {!userRole?.isAdmin && !ticketsLoading && tickets && tickets.filter(t => {
          const quoteStatus = getQuoteStatus(t);
          return quoteStatus.needsPO && (t.status === 'resolved' || t.status === 'pending_acknowledgment');
        }).length > 0 && (
          <Card className="mb-6 border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Pending Your Review</h3>
                  <p className="text-sm text-muted-foreground">
                    {tickets.filter(t => {
                      const quoteStatus = getQuoteStatus(t);
                      return quoteStatus.needsPO && (t.status === 'resolved' || t.status === 'pending_acknowledgment');
                    }).length} ticket(s) requiring PO number
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tickets.filter(t => {
                  const quoteStatus = getQuoteStatus(t);
                  return quoteStatus.needsPO && (t.status === 'resolved' || t.status === 'pending_acknowledgment');
                }).map((ticket) => {
                  const quoteStatus = getQuoteStatus(ticket);
                  
                  return (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{ticket.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Ticket #{parseInt(ticket.ticket_number?.toString() || '0')}
                      </div>
                      <div className="mt-2">
                        <Badge className={cn('rounded-md px-3 py-1 text-xs font-medium', quoteStatus.className)}>
                          {quoteStatus.label}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-3">
                      Add PO Number
                    </Button>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Awaiting Payment Section - Only show to non-admin users */}
        {!userRole?.isAdmin && !ticketsLoading && tickets && tickets.filter(t => t.status === 'awaiting_payment').length > 0 && (
          <Card className="mb-6 border-2 border-purple-500 bg-purple-50 dark:bg-purple-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Awaiting Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    {tickets.filter(t => t.status === 'awaiting_payment').length} ticket(s) completed and awaiting payment
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tickets.filter(t => t.status === 'awaiting_payment').map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{ticket.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Ticket #{parseInt(ticket.ticket_number?.toString() || '0')}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-3">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Tickets Section with Tabs */}
        <div className="mb-4 md:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl md:text-2xl font-bold">Your Tickets</h2>
            <Button 
              className="gap-2 w-full sm:w-auto"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Submit New Request</span>
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="po-needed">PO Needed</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Filters */}
          <div className="mb-4 md:mb-6 flex flex-col gap-3 md:flex-row md:items-center">
            {selectedTickets.length > 0 ? (
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm font-medium">
                  {selectedTickets.length} ticket(s) selected
                </span>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statusOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleBulkStatusChange(option.value)}
                          className="cursor-pointer"
                        >
                          <Badge className={cn('rounded-md px-3 py-1 text-xs font-medium w-full justify-center', option.className)}>
                            {option.label}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {userRole?.isAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTickets([])}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {statusFilter === 'all' ? 'All Statuses' : getStatusDisplay(statusFilter).label}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  <DropdownMenuItem
                    onClick={() => setStatusFilter('all')}
                    className="cursor-pointer"
                  >
                    All Statuses
                  </DropdownMenuItem>
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className="cursor-pointer"
                    >
                      <Badge className={cn('rounded-md px-3 py-1 text-xs font-medium w-full justify-center', option.className)}>
                        {option.label}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Client Filter - Admin Only */}
              {userRole?.isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {clientFilter === 'all' ? 'All Clients' : clients?.find(c => c.id === clientFilter)?.name || 'Client'}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[220px] max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem
                      onClick={() => setClientFilter('all')}
                      className="cursor-pointer"
                    >
                      All Clients
                    </DropdownMenuItem>
                    {clients?.map((client) => (
                      <DropdownMenuItem
                        key={client.id}
                        onClick={() => setClientFilter(client.id)}
                        className="cursor-pointer"
                      >
                        {client.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* PO Filter - Admin Only */}
              {userRole?.isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {poFilter === 'all' ? 'All PO Status' : poFilter === 'with_po' ? 'Has PO' : 'No PO'}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem
                      onClick={() => setPoFilter('all')}
                      className="cursor-pointer"
                    >
                      All PO Status
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPoFilter('without_po')}
                      className="cursor-pointer"
                    >
                      Missing PO
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPoFilter('with_po')}
                      className="cursor-pointer"
                    >
                      Has PO Number
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Sort: {sortBy === 'created_at' ? 'Date' : sortBy === 'client' ? 'Client' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy('created_at');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                    className="cursor-pointer"
                  >
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy('title');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                    className="cursor-pointer"
                  >
                    Title
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy('priority');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                    className="cursor-pointer"
                  >
                    Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy('status');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                    className="cursor-pointer"
                  >
                    Status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy('client');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                    className="cursor-pointer"
                  >
                    Client
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy('due_date');
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                    className="cursor-pointer"
                  >
                    Due Date
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
              </>
            )}
          </div>

          {/* Tickets Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden lg:grid lg:grid-cols-[56px_minmax(200px,2fr)_minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px] gap-4 border-b border-border bg-muted/50 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  className="rounded border-border w-4 h-4" 
                  checked={tickets && tickets.length > 0 && selectedTickets.length === tickets.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </div>
              <div>TICKET</div>
              <div>CLIENT</div>
              <div>ASSIGNED</div>
              <div>QUOTE</div>
              <div>STATUS</div>
              <div className="text-right">DUE DATE</div>
            </div>
            <div className="divide-y divide-border">
              {ticketsLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <div key={i} className="p-4 lg:grid lg:grid-cols-[56px_minmax(200px,2fr)_minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px] lg:gap-4 lg:px-6 lg:py-4">
                     <Skeleton className="h-4 w-4 mb-3 lg:mb-0" />
                     <div className="space-y-2 mb-3 lg:mb-0">
                       <Skeleton className="h-4 w-3/4" />
                       <Skeleton className="h-3 w-1/2" />
                     </div>
                     <Skeleton className="h-4 w-1/2 mb-3 lg:mb-0" />
                     <Skeleton className="h-4 w-1/3 mb-3 lg:mb-0" />
                     <Skeleton className="h-6 w-24 mb-3 lg:mb-0" />
                     <Skeleton className="h-6 w-24 mb-3 lg:mb-0" />
                     <Skeleton className="h-8 w-full lg:w-16" />
                   </div>
                 ))
              ) : tickets && tickets.length > 0 ? (
                userRole?.isAdmin ? (
                  // Group by client for admins (agency-managed clients grouped under agency)
                  (() => {
                    const groupedTickets: { [key: string]: typeof sortedParentTickets } = {};
                    sortedParentTickets
                      .filter(ticket => {
                        const childTickets = getChildTickets(ticket.id);
                        return ticketMatchesFilter(ticket, childTickets);
                      })
                      .forEach(ticket => {
                        // Group by managing agency if it's an agency-managed client, otherwise by client name
                        const groupName = ticket.client?.managing_agency?.name || ticket.client?.name || 'No Client';
                        if (!groupedTickets[groupName]) {
                          groupedTickets[groupName] = [];
                        }
                        groupedTickets[groupName].push(ticket);
                      });

                    return Object.entries(groupedTickets)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([groupName, clientTickets]) => {
                        const isGroupExpanded = !expandedGroups.includes(groupName);
                        return (
                          <Collapsible key={groupName} open={isGroupExpanded} onOpenChange={() => toggleGroupExpansion(groupName)}>
                            <CollapsibleTrigger className="w-full">
                              <div className="bg-muted/70 px-6 py-2 font-semibold text-sm border-b border-border flex items-center gap-2 hover:bg-muted cursor-pointer">
                                {isGroupExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-primary" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-primary" />
                                )}
                                <span>{groupName}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {clientTickets.length}
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              {clientTickets.map(ticket => renderTicketRow(ticket))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      });
                  })()
                ) : (
                  // Original flat list for non-admins
                  sortedParentTickets
                    .filter(ticket => {
                      const childTickets = getChildTickets(ticket.id);
                      return ticketMatchesFilter(ticket, childTickets);
                    })
                    .map((ticket) => renderTicketRow(ticket))
                )
              ) : (
                <div className="px-4 md:px-6 py-12 text-center text-muted-foreground">
                  <p>No tickets found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* AI Ticket Assistant FAB - Admin Only */}
      {userRole?.isAdmin && (
        <>
          <button
            onClick={() => setAiDialogOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-50"
            aria-label="AI Ticket Assistant"
          >
            <Sparkles className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
          <AITicketDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} />
        </>
      )}
      
      <CreateTicketDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
