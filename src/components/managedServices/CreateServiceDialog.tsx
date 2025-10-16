import { useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateServiceDialog = ({ open, onOpenChange }: CreateServiceDialogProps) => {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('website_management');
  const [monthlyAmount, setMonthlyAmount] = useState('50');
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [billingStartDate, setBillingStartDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['clients-for-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const deliverablesList = deliverables
        .split('\n')
        .filter(d => d.trim())
        .map(d => d.trim());

      const startDate = new Date(billingStartDate);
      
      const { data: service, error } = await supabase
        .from('managed_services')
        .insert({
          client_id: clientId,
          service_type: serviceType,
          service_name: serviceName,
          description: description || null,
          monthly_amount: parseFloat(monthlyAmount),
          billing_interval: billingInterval,
          billing_start_date: startDate.toISOString(),
          next_billing_date: startDate.toISOString(),
          deliverables: deliverablesList.length > 0 ? deliverablesList : null,
          notes: notes || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return service;
    },
    onSuccess: async (service) => {
      // Create Stripe subscription for the managed service
      try {
        const { error: stripeError } = await supabase.functions.invoke(
          'create-managed-service-subscription',
          { body: { managed_service_id: service.id } }
        );
        
        if (stripeError) {
          console.error('Error creating Stripe subscription:', stripeError);
          toast.error('Service created but Stripe subscription setup failed');
        }
      } catch (error) {
        console.error('Error calling Stripe function:', error);
      }

      queryClient.invalidateQueries({ queryKey: ['managed-services'] });
      queryClient.invalidateQueries({ queryKey: ['managed-services-stats'] });
      toast.success('Managed service created successfully');
      
      // Reset form
      setClientId('');
      setServiceName('');
      setServiceType('website_management');
      setMonthlyAmount('50');
      setBillingInterval('monthly');
      setBillingStartDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setDescription('');
      setDeliverables('');
      setNotes('');
      
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      toast.error('Failed to create managed service');
    },
  });

  const handleSubmit = () => {
    if (!clientId || !serviceName || !monthlyAmount || !billingStartDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Managed Service</DialogTitle>
          <DialogDescription>
            Set up a new recurring managed service for a client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="serviceName">Service Name *</Label>
            <Input
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g., ABC Corp Website Management"
            />
          </div>

          <div>
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger id="serviceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website_management">Website Management</SelectItem>
                <SelectItem value="hosting">Hosting</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="seo">SEO</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyAmount">Monthly Amount ($) *</Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.01"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="billingInterval">Billing Interval *</Label>
              <Select value={billingInterval} onValueChange={setBillingInterval}>
                <SelectTrigger id="billingInterval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="billingStartDate">Billing Start Date *</Label>
            <Input
              id="billingStartDate"
              type="date"
              value={billingStartDate}
              onChange={(e) => setBillingStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground mt-1">
              First billing will occur on {format(new Date(billingStartDate), 'MMM dd, yyyy')}
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the service..."
            />
          </div>

          <div>
            <Label htmlFor="deliverables">Deliverables/Scope (one per line)</Label>
            <Textarea
              id="deliverables"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              rows={5}
              placeholder="Weekly content updates&#10;Monthly performance reports&#10;24/7 monitoring"
            />
          </div>

          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this service..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !clientId || !serviceName || !monthlyAmount}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
