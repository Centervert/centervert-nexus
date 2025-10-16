import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateClientDialog = ({ open, onOpenChange, onSuccess }: CreateClientDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client_type: 'direct',
    payment_terms: '',
    managing_agency_id: '',
    billing_street1: '',
    billing_street2: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    tax_id: '',
    website: '',
    phone: '',
    notes: '',
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('client_type', 'agency')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const billingAddress = [
        formData.billing_street1,
        formData.billing_street2,
        formData.billing_city,
        formData.billing_state,
        formData.billing_zip
      ].filter(Boolean).join(', ') || null;

      const { error } = await supabase.from('clients').insert([{
        name: formData.name,
        client_type: formData.client_type as any,
        payment_terms: formData.payment_terms || null,
        managing_agency_id: formData.managing_agency_id || null,
        billing_address: billingAddress,
        tax_id: formData.tax_id || null,
        website: formData.website || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client created successfully',
      });

      setFormData({
        name: '',
        client_type: 'direct',
        payment_terms: '',
        managing_agency_id: '',
        billing_street1: '',
        billing_street2: '',
        billing_city: '',
        billing_state: '',
        billing_zip: '',
        tax_id: '',
        website: '',
        phone: '',
        notes: '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_type">Client Type *</Label>
              <Select
                value={formData.client_type}
                onValueChange={(value) => setFormData({ ...formData, client_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="agency_managed">Agency Managed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.client_type === 'agency_managed' && agencies && (
              <div className="space-y-2">
                <Label htmlFor="managing_agency_id">Managing Agency</Label>
                <Select
                  value={formData.managing_agency_id}
                  onValueChange={(value) => setFormData({ ...formData, managing_agency_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agency" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Select
              value={formData.payment_terms}
              onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 90">Net 90</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID / EIN</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Billing Address</Label>
            <div className="space-y-2">
              <Input
                placeholder="Street 1"
                value={formData.billing_street1}
                onChange={(e) => setFormData({ ...formData, billing_street1: e.target.value })}
              />
              <Input
                placeholder="Street 2 (Optional)"
                value={formData.billing_street2}
                onChange={(e) => setFormData({ ...formData, billing_street2: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={formData.billing_city}
                  onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                />
                <Input
                  placeholder="State"
                  value={formData.billing_state}
                  onChange={(e) => setFormData({ ...formData, billing_state: e.target.value })}
                />
                <Input
                  placeholder="Zip"
                  value={formData.billing_zip}
                  onChange={(e) => setFormData({ ...formData, billing_zip: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
