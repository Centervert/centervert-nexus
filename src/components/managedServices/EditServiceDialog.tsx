import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ManagedService } from '@/hooks/useManagedServices';

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ManagedService;
}

export const EditServiceDialog = ({ open, onOpenChange, service }: EditServiceDialogProps) => {
  const queryClient = useQueryClient();
  const [serviceName, setServiceName] = useState(service.service_name);
  const [serviceType, setServiceType] = useState(service.service_type);
  const [monthlyAmount, setMonthlyAmount] = useState(service.monthly_amount.toString());
  const [billingInterval, setBillingInterval] = useState(service.billing_interval);
  const [description, setDescription] = useState(service.description || '');
  const [deliverables, setDeliverables] = useState(service.deliverables?.join('\n') || '');
  const [notes, setNotes] = useState(service.notes || '');

  useEffect(() => {
    setServiceName(service.service_name);
    setServiceType(service.service_type);
    setMonthlyAmount(service.monthly_amount.toString());
    setBillingInterval(service.billing_interval);
    setDescription(service.description || '');
    setDeliverables(service.deliverables?.join('\n') || '');
    setNotes(service.notes || '');
  }, [service, open]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const deliverablesList = deliverables
        .split('\n')
        .filter(d => d.trim())
        .map(d => d.trim());

      const { error } = await supabase
        .from('managed_services')
        .update({
          service_name: serviceName,
          service_type: serviceType,
          monthly_amount: parseFloat(monthlyAmount),
          billing_interval: billingInterval,
          description: description || null,
          deliverables: deliverablesList.length > 0 ? deliverablesList : null,
          notes: notes || null,
        })
        .eq('id', service.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-service', service.id] });
      queryClient.invalidateQueries({ queryKey: ['managed-services'] });
      queryClient.invalidateQueries({ queryKey: ['managed-services-stats'] });
      toast.success('Service updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Managed Service</DialogTitle>
          <DialogDescription>Update the service details and billing information</DialogDescription>
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
            <Label htmlFor="description">Description</Label>
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
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !serviceName || !monthlyAmount}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
