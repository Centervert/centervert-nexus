import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter, ArrowUpDown, Ticket as TicketIcon, MessageSquare, Clock, FileText } from 'lucide-react';
import { useTickets, useTicketStats } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'priority' | 'status'>('created_at');

  const { data: tickets, isLoading: ticketsLoading } = useTickets({ 
    search: searchQuery, 
    status: statusFilter,
    sortBy 
  });
  const { data: stats, isLoading: statsLoading } = useTicketStats();

  const statsCards = [
    { icon: TicketIcon, label: 'Open Tickets', value: stats?.open || '0', color: 'text-blue-600' },
    { icon: MessageSquare, label: 'Need Response', value: stats?.needResponse || '0', color: 'text-yellow-600' },
    { icon: Clock, label: 'In Progress', value: stats?.inProgress || '0', color: 'text-purple-600' },
    { icon: FileText, label: 'Total Tickets', value: stats?.total || '0', color: 'text-gray-600' },
  ];

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      open: { label: 'Open', className: 'bg-blue-500 text-white' },
      in_progress: { label: 'In Progress', className: 'bg-purple-500 text-white' },
      awaiting_response: { label: 'Awaiting Response', className: 'bg-yellow-500 text-black' },
      resolved: { label: 'Resolved', className: 'bg-green-500 text-white' },
      closed: { label: 'Closed', className: 'bg-gray-500 text-white' },
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
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-center border-b border-border bg-card px-8">
          <div className="flex items-center gap-2 rounded-full bg-status-complete/10 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-status-complete" />
            <span className="text-sm font-medium text-status-complete">All Systems Operational</span>
          </div>
        </div>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Tickets</h2>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Submit New Request
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
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
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                All Statuses
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Date
              </Button>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="rounded-lg border border-border bg-card">
            <div className="grid grid-cols-[auto_2fr_1.5fr_1.5fr_auto] gap-4 border-b border-border bg-muted/50 px-6 py-3 text-sm font-medium text-muted-foreground">
              <div className="w-8"></div>
              <div>TICKET</div>
              <div>CREATED BY</div>
              <div>STATUS</div>
              <div>DETAILS</div>
            </div>
            <div className="divide-y divide-border">
              {ticketsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[auto_2fr_1.5fr_1.5fr_auto] gap-4 px-6 py-4">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              ) : tickets && tickets.length > 0 ? (
                tickets.map((ticket) => {
                  const statusDisplay = getStatusDisplay(ticket.status);
                  const priorityDisplay = getPriorityDisplay(ticket.priority);

                  return (
                    <div
                      key={ticket.id}
                      className="grid grid-cols-[auto_2fr_1.5fr_1.5fr_auto] gap-4 px-6 py-4 hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <input type="checkbox" className="rounded border-border" />
                      </div>
                      <div>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.categories?.name || 'Uncategorized'} • {' '}
                          <span className={priorityDisplay.className}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        {ticket.creator?.full_name || ticket.creator?.email || 'Unknown'}
                      </div>
                      <div className="flex items-center">
                        <Badge className={cn('w-fit', statusDisplay.className)}>
                          {statusDisplay.label}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  <p>No tickets found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
