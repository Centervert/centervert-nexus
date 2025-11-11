import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useManagedServices, useManagedServicesStats } from '@/hooks/useManagedServices';
import { useUserRole } from '@/hooks/useUserRole';
import { DollarSign, RefreshCw, Pause, TrendingUp, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { CreateServiceDialog } from '@/components/managedServices/CreateServiceDialog';

export default function ManagedServices() {
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: services, isLoading } = useManagedServices({
    search,
    status: statusFilter,
  });

  const { data: stats } = useManagedServicesStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const normalizeStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Managed Services</h1>
              <p className="text-muted-foreground">
                Track and manage recurring client services
              </p>
            </div>
            {(userRole?.isAdmin || userRole?.isAgent) && (
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Service
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.totalMRR.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.active || 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paused Services</CardTitle>
                <Pause className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.paused || 0}</div>
                <p className="text-xs text-muted-foreground">Temporarily paused</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Services List */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading services...
                </div>
              ) : services && services.length > 0 ? (
                <div className="divide-y">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => navigate(`/managed-services/${service.id}`)}
                      className="p-6 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold truncate">{service.service_name}</h3>
                            <Badge variant="outline" className={getStatusColor(service.status)}>
                              {normalizeStatus(service.status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="truncate">Client: {service.client?.name || 'Unknown'}</p>
                            <p>Type: {service.service_type.replace('_', ' ')}</p>
                            {service.original_ticket && (
                              <p className="truncate">
                                From Ticket {parseInt(service.original_ticket.ticket_number?.toString() || '0')}:{' '}
                                {service.original_ticket.title}
                              </p>
                            )}
                            <p>Next billing: {format(new Date(service.next_billing_date), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-xl sm:text-2xl font-bold">
                            ${Number(service.monthly_amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            per {service.billing_interval}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No managed services found. Convert resolved tickets to managed services to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Service Dialog */}
          {(userRole?.isAdmin || userRole?.isAgent) && (
            <CreateServiceDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
            />
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
