import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SettingsSidebar from '@/components/SettingsSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building2, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateClientDialog } from '@/components/clients/CreateClientDialog';

const Clients = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [clientTypeFilter, setClientTypeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['clients', searchQuery, clientTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          client_users(count)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (clientTypeFilter) {
        query = query.eq('client_type', clientTypeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch managing agency names separately for agency_managed clients
      const clientsWithAgencies = await Promise.all(
        (data || []).map(async (client) => {
          if (client.managing_agency_id) {
            const { data: agency } = await supabase
              .from('clients')
              .select('name')
              .eq('id', client.managing_agency_id)
              .single();
            
            return { ...client, managing_agency: agency };
          }
          return client;
        })
      );

      return clientsWithAgencies;
    },
  });

  const getClientTypeBadge = (type: string) => {
    const variants = {
      direct: 'default',
      agency: 'secondary',
      agency_managed: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SettingsSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Client Management</h1>
          </div>

          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Clients</h2>
                <p className="text-muted-foreground">Manage your clients and their settings</p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>

            <div className="mb-6 flex flex-col gap-3 md:gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('card')}
                    title="Card view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={clientTypeFilter === null ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter(null)}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={clientTypeFilter === 'direct' ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter('direct')}
                  size="sm"
                >
                  Direct
                </Button>
                <Button
                  variant={clientTypeFilter === 'agency' ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter('agency')}
                  size="sm"
                >
                  Agency
                </Button>
                <Button
                  variant={clientTypeFilter === 'agency_managed' ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter('agency_managed')}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Agency Managed
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading clients...</div>
            ) : clients && clients.length > 0 ? (
              viewMode === 'card' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clients.map((client) => (
                  <Card
                      key={client.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Building2 className="h-5 w-5 text-primary shrink-0" />
                              <CardTitle className="text-lg truncate">
                                {client.name}
                              </CardTitle>
                              <Badge variant="outline" className="text-xs font-mono shrink-0">
                                {client.id.slice(0, 6).toUpperCase()}
                              </Badge>
                            </div>
                            {(client as any).managing_agency?.name && (
                              <Badge variant="secondary" className="gap-1 self-start">
                                🏢 Managed by {(client as any).managing_agency?.name}
                              </Badge>
                            )}
                          </div>
                          {getClientTypeBadge(client.client_type)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {client.payment_terms && (
                            <div>
                              <span className="text-muted-foreground">Payment Terms: </span>
                              <span className="font-medium">{client.payment_terms}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Active Users: </span>
                            <span className="font-medium">{client.client_users?.[0]?.count || 0}</span>
                          </div>
                          <div>
                            <Badge variant={client.is_active ? 'default' : 'secondary'}>
                              {client.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold truncate">{client.name}</h3>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {client.id.slice(0, 6).toUpperCase()}
                                </Badge>
                                {getClientTypeBadge(client.client_type)}
                              </div>
                              {(client as any).managing_agency?.name && (
                                <Badge variant="secondary" className="gap-1 mb-1">
                                  🏢 Managed by {(client as any).managing_agency?.name}
                                </Badge>
                              )}
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                {client.payment_terms && (
                                  <span>Payment: {client.payment_terms}</span>
                                )}
                                <span>{client.client_users?.[0]?.count || 0} users</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={client.is_active ? 'default' : 'secondary'}>
                            {client.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No clients found.</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Client
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <CreateClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />
    </SidebarProvider>
  );
};

export default Clients;
