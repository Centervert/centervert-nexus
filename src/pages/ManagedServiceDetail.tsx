import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useManagedService } from '@/hooks/useManagedServices';
import { useUserRole } from '@/hooks/useUserRole';
import { useStripeSetting } from '@/hooks/useSystemSettings';
import { ArrowLeft, Edit, Pause, Play, XCircle, ExternalLink, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { EditServiceDialog } from '@/components/managedServices/EditServiceDialog';
import { CancelServiceDialog } from '@/components/managedServices/CancelServiceDialog';

export default function ManagedServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();
  const { data: stripeEnabled } = useStripeSetting();
  const isAdminOrAgent = userRole?.isAdmin || userRole?.isAgent;

  const { data: service, isLoading } = useManagedService(id!);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!service) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar />
          <main className="flex-1 p-8">
            <p className="text-muted-foreground">Service not found</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const daysUntilBilling = differenceInDays(new Date(service.next_billing_date), new Date());

  const handleManageBilling = async () => {
    if (!service) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-customer-portal-session', {
        body: {
          client_id: service.client_id,
          return_url: window.location.href,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast.error('Failed to open billing portal');
    }
  };

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
          <Button
            variant="ghost"
            onClick={() => navigate('/managed-services')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>

          <div className="flex flex-col gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{service.service_name}</h1>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={getStatusColor(service.status)}>
                  {normalizeStatus(service.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {service.service_type.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {stripeEnabled && service.stripe_subscription_id && (
                <Button variant="outline" size="sm" onClick={handleManageBilling}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Manage Billing</span>
                  <span className="sm:hidden">Billing</span>
                </Button>
              )}
              {isAdminOrAgent && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {service.status === 'active' && (
                    <Button variant="outline" size="sm">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  {service.status === 'paused' && (
                    <Button variant="outline" size="sm">
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  )}
                  {service.status !== 'cancelled' && (
                    <Button variant="outline" size="sm" onClick={() => setCancelDialogOpen(true)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Monthly Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${Number(service.monthly_amount).toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">per {service.billing_interval}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {daysUntilBilling} days
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(service.next_billing_date), 'MMM dd, yyyy')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {format(new Date(service.billing_start_date), 'MMM dd')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(service.billing_start_date), 'yyyy')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Client</h4>
                  <p className="text-muted-foreground">{service.client?.name || 'Unknown'}</p>
                </div>

                {service.description && (
                  <div>
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>
                )}

                {service.original_ticket && (
                  <div>
                    <h4 className="font-medium mb-1">Original Ticket</h4>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate(`/tickets/${service.original_ticket_id}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ticket {parseInt(service.original_ticket.ticket_number?.toString() || '0')}:{' '}
                      {service.original_ticket.title}
                    </Button>
                  </div>
                )}

                {service.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Notes</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{service.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deliverables / Scope</CardTitle>
              </CardHeader>
              <CardContent>
                {service.deliverables && service.deliverables.length > 0 ? (
                  <ul className="space-y-2">
                    {service.deliverables.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No deliverables specified</p>
                )}
              </CardContent>
            </Card>
          </div>

          {isAdminOrAgent && (
            <>
              <EditServiceDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                service={service}
              />
              <CancelServiceDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                serviceId={service.id}
                serviceName={service.service_name}
              />
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
