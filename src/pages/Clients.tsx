import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateClientDialog } from '@/components/clients/CreateClientDialog';

const Clients = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [clientTypeFilter, setClientTypeFilter] = useState<string | null>(null);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['clients', searchQuery, clientTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          client_users(count)
        `)
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
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
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

            <div className="mb-6 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={clientTypeFilter === null ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter(null)}
                >
                  All
                </Button>
                <Button
                  variant={clientTypeFilter === 'direct' ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter('direct')}
                >
                  Direct
                </Button>
                <Button
                  variant={clientTypeFilter === 'agency' ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter('agency')}
                >
                  Agency
                </Button>
                <Button
                  variant={clientTypeFilter === 'agency_managed' ? 'default' : 'outline'}
                  onClick={() => setClientTypeFilter('agency_managed')}
                >
                  Agency Managed
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading clients...</div>
            ) : clients && clients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                  <Card
                    key={client.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                        </div>
                        {getClientTypeBadge(client.client_type)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {(client as any).managing_agency && (
                          <div>
                            <span className="text-muted-foreground">Managed by: </span>
                            <span className="font-medium">{(client as any).managing_agency?.name}</span>
                          </div>
                        )}
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
