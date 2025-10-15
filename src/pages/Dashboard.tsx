import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, ArrowUpDown, Ticket as TicketIcon, MessageSquare, DollarSign, FileText } from 'lucide-react';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for stats
  const stats = [
    { icon: TicketIcon, label: 'Open Tickets', value: '4', color: 'text-blue-600' },
    { icon: MessageSquare, label: 'Need Response', value: '1', color: 'text-yellow-600' },
    { icon: DollarSign, label: 'Finance Approval', value: '1', color: 'text-purple-600' },
    { icon: FileText, label: 'Total Tickets', value: '5', color: 'text-gray-600' },
  ];

  // Mock tickets data
  const tickets = [
    {
      id: '1237',
      title: 'Technical Support Request',
      client: 'Xulon Press',
      status: 'New Request',
      category: 'IT → Technical Help',
      statusColor: 'bg-status-new text-white',
    },
    {
      id: '1236',
      title: 'Email Campaign Design',
      client: 'Pickle Yard',
      status: 'Awaiting Finance Approval',
      category: 'Creative → Email Creation',
      statusColor: 'bg-status-finance text-white',
    },
    {
      id: '1235',
      title: 'CRM Setup for Fox Commercial',
      client: 'Fox Commercial Properties',
      status: 'Awaiting Your Response',
      category: 'CRM/ERP → Build Out',
      statusColor: 'bg-status-awaiting text-black',
    },
    {
      id: '1234',
      title: 'Website for Xulon Press',
      client: 'Xulon Press',
      status: 'In Progress',
      category: 'Creative → Website Development',
      statusColor: 'bg-status-progress text-white',
    },
    {
      id: '1238',
      title: 'Landing Page for Campaign',
      client: 'Fox Commercial Properties',
      status: 'Complete',
      category: 'Creative → Landing Page',
      statusColor: 'bg-status-complete text-white',
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
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
              <div>CLIENT</div>
              <div>STATUS</div>
              <div>DETAILS</div>
            </div>
            <div className="divide-y divide-border">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="grid grid-cols-[auto_2fr_1.5fr_1.5fr_auto] gap-4 px-6 py-4 hover:bg-muted/50"
                >
                  <div className="flex items-center">
                    <input type="checkbox" className="rounded border-border" />
                  </div>
                  <div>
                    <div className="font-medium">{ticket.title}</div>
                    <div className="text-sm text-muted-foreground">#{ticket.id}</div>
                  </div>
                  <div className="flex items-center">{ticket.client}</div>
                  <div className="flex flex-col gap-1">
                    <Badge className={`w-fit ${ticket.statusColor}`}>
                      {ticket.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{ticket.category}</span>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
