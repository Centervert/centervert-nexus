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
import { Plus, Search, Filter, ArrowUpDown, Ticket as TicketIcon, MessageSquare, Clock, FileText, ChevronDown } from 'lucide-react';
import { useTickets, useTicketStats } from '@/hooks/useTickets';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'priority' | 'status'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { data: userRole } = useUserRole();

  const { data: tickets, isLoading: ticketsLoading } = useTickets({
    search: searchQuery, 
    status: statusFilter,
    sortBy,
    sortDirection
  });
  const { data: stats, isLoading: statsLoading } = useTicketStats();

  const statusOptions = [
    { value: 'open' as const, label: 'New Request', className: 'bg-gray-900 text-white' },
    { value: 'in_progress' as const, label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
    { value: 'awaiting_response' as const, label: 'Awaiting Your Response', className: 'bg-yellow-500 text-white' },
    { value: 'closed' as const, label: 'Awaiting Finance Approval', className: 'bg-purple-100 text-purple-800' },
    { value: 'resolved' as const, label: 'Complete', className: 'bg-green-100 text-green-800' },
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2.5 rounded-full bg-emerald-50 px-5 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">All Systems Operational</span>
            </div>
          </div>

          <div className="p-4 md:p-8">
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

          {/* Tickets Section */}
          <div className="mb-4 md:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl md:text-2xl font-bold">Your Tickets</h2>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Submit New Request</span>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 md:mb-6 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
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
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 flex-1 sm:flex-initial"
                onClick={() => {
                  setSortBy('created_at');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Date {sortDirection === 'asc' ? '↑' : '↓'}</span>
              </Button>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-[56px_2fr_1.5fr_200px_1fr] gap-6 border-b border-border bg-muted/50 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div></div>
              <div>TICKET</div>
              <div>CLIENT</div>
              <div>STATUS</div>
              <div className="text-right">DUE DATE</div>
            </div>
            <div className="divide-y divide-border">
              {ticketsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 md:grid md:grid-cols-[auto_2fr_1.5fr_1.5fr_auto] md:gap-4 md:px-6">
                    <Skeleton className="h-4 w-4 mb-3 md:mb-0" />
                    <div className="space-y-2 mb-3 md:mb-0">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-1/2 mb-3 md:mb-0" />
                    <Skeleton className="h-6 w-24 mb-3 md:mb-0" />
                    <Skeleton className="h-8 w-full md:w-16" />
                  </div>
                ))
              ) : tickets && tickets.length > 0 ? (
                tickets.map((ticket) => {
                  const statusDisplay = getStatusDisplay(ticket.status);
                  const priorityDisplay = getPriorityDisplay(ticket.priority);

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer md:grid md:grid-cols-[56px_2fr_1.5fr_200px_1fr] md:gap-6 md:px-6 md:py-4"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium mb-1">{ticket.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span>#{ticket.id.slice(0, 4)}</span>
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
                          {ticket.creator?.company || ticket.creator?.full_name || 'Unknown'}
                          {ticket.end_client_name && (
                            <span> <span className="mx-2">→</span> {ticket.end_client_name}</span>
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
                      <div className="hidden md:flex md:items-center md:gap-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-border w-4 h-4 shrink-0" 
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <div className="hidden md:flex md:flex-col md:justify-center md:min-w-0">
                        <div className="font-medium leading-tight truncate">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <span>#{ticket.id.slice(0, 4)}</span>
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
                      <div className="hidden md:flex md:items-center text-sm">
                        {ticket.creator?.company || ticket.creator?.full_name || 'Unknown'}
                        {ticket.end_client_name && (
                          <span className="text-muted-foreground"> <span className="mx-2">→</span> {ticket.end_client_name}</span>
                        )}
                      </div>
                      <div className="hidden md:flex md:items-center md:justify-center">
                        {userRole?.isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
                            >
                              <Badge className={cn('rounded-md px-3 py-1.5 gap-1.5 font-medium min-w-[200px] justify-center cursor-pointer hover:opacity-80 transition-opacity', statusDisplay.className)}>
                                {statusDisplay.label}
                                <ChevronDown className="h-3 w-3" />
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              className="w-[200px] z-[100]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {statusOptions.map((option) => (
                                <DropdownMenuItem
                                  key={option.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(ticket.id, option.value);
                                  }}
                                  className="cursor-pointer p-1"
                                >
                                  <Badge className={cn('rounded-md px-3 py-1 text-xs font-medium w-full justify-center', option.className)}>
                                    {option.label}
                                  </Badge>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge className={cn('rounded-md px-3 py-1.5 font-medium min-w-[200px] justify-center', statusDisplay.className)}>
                            {statusDisplay.label}
                          </Badge>
                        )}
                      </div>
                      <div className="hidden md:flex md:items-center md:justify-end text-sm">
                        {ticket.due_date 
                          ? new Date(ticket.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : <span className="text-muted-foreground">N/A</span>
                        }
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 md:px-6 py-12 text-center text-muted-foreground">
                  <p>No tickets found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
