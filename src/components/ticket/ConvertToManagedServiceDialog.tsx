import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ConvertToManagedServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketTitle: string;
  clientId: string | null;
  resolvedAt: string | null;
  quoteData?: {
    amount: number;
    deliverables: string[] | null;
    billing_interval: string | null;
  };
}

export const ConvertToManagedServiceDialog = ({
  open,
  onOpenChange,
  ticketId,
  ticketTitle,
  clientId,
  resolvedAt,
  quoteData,
}: ConvertToManagedServiceDialogProps) => {
  const queryClient = useQueryClient();
  const [serviceName, setServiceName] = useState(ticketTitle);
  const [serviceType, setServiceType] = useState('website_management');
  const [monthlyAmount, setMonthlyAmount] = useState(quoteData?.amount?.toString() || '50');
  const [billingInterval, setBillingInterval] = useState(quoteData?.billing_interval || 'monthly');
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState(
    quoteData?.deliverables?.join('\n') || ''
  );

  const billingStartDate = resolvedAt
    ? new Date(new Date(resolvedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('Client ID is required');

      const deliverablesList = deliverables
        .split('\n')
        .filter(d => d.trim())
        .map(d => d.trim());

      const { data: service, error: serviceError } = await supabase
        .from('managed_services')
        .insert({
          original_ticket_id: ticketId,
          client_id: clientId,
          service_type: serviceType,
          service_name: serviceName,
          description: description || null,
          monthly_amount: parseFloat(monthlyAmount),
          billing_interval: billingInterval,
          billing_start_date: billingStartDate.toISOString(),
          next_billing_date: billingStartDate.toISOString(),
          deliverables: deliverablesList.length > 0 ? deliverablesList : null,
          status: 'active',
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      await supabase
        .from('tickets')
        .update({ managed_service_id: service.id })
        .eq('id', ticketId);

      await supabase.from('ticket_milestones').insert({
        ticket_id: ticketId,
        type: 'status_change',
        title: 'Converted to Managed Service',
        description: `This ticket has been converted to a managed service: ${serviceName}`,
        status: 'completed',
      });

      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['managed-services'] });
      queryClient.invalidateQueries({ queryKey: ['managed-services-stats'] });
      toast.success('Ticket converted to managed service successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error converting ticket:', error);
      toast.error('Failed to convert ticket to managed service');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert to Managed Service</DialogTitle>
          <DialogDescription>
            Create a recurring managed service from this resolved ticket.
            Billing will start on {format(billingStartDate, 'MMM dd, yyyy')} (30 days after resolution).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="serviceType">Service Type</Label>
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
              <Label htmlFor="monthlyAmount">Monthly Amount ($)</Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.01"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="billingInterval">Billing Interval</Label>
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
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="deliverables">Deliverables/Scope (one per line)</Label>
            <Textarea
              id="deliverables"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              rows={5}
              placeholder="Enter each deliverable on a new line..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending || !serviceName || !monthlyAmount || !clientId}
            >
              {convertMutation.isPending ? 'Converting...' : 'Convert to Managed Service'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
