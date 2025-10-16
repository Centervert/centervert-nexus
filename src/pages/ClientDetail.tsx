import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { ClientOverview } from '@/components/clients/ClientOverview';
import { ClientContacts } from '@/components/clients/ClientContacts';
import { ClientUsers } from '@/components/clients/ClientUsers';
import { ClientTickets } from '@/components/clients/ClientTickets';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching client:', error);
        throw error;
      }
      
      if (!data) return null;
      
      // Fetch managing agency separately if needed
      let clientWithAgency: any = { ...data };
      if (data.managing_agency_id) {
        const { data: agency } = await supabase
          .from('clients')
          .select('id, name')
          .eq('id', data.managing_agency_id)
          .maybeSingle();
        
        if (agency) {
          clientWithAgency.managing_agency = agency;
        }
      }
      
      return clientWithAgency;
    },
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 text-center text-muted-foreground">Loading client...</div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!client) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 text-center text-muted-foreground">Client not found</div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="flex h-16 items-center gap-4 border-b border-border bg-muted/30 px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground capitalize">{client.client_type.replace('_', ' ')} Client</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <ClientOverview client={client} />
              </TabsContent>

              <TabsContent value="contacts">
                <ClientContacts clientId={client.id} />
              </TabsContent>

              <TabsContent value="users">
                <ClientUsers clientId={client.id} />
              </TabsContent>

              <TabsContent value="tickets">
                <ClientTickets clientId={client.id} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ClientDetail;
