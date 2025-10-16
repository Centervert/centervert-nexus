import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X } from 'lucide-react';

interface ClientOverviewProps {
  client: any;
}

export const ClientOverview = ({ client }: ClientOverviewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: client.name,
    payment_terms: client.payment_terms || '',
    payment_terms_days: client.payment_terms_days || '',
    billing_address: client.billing_address || '',
    tax_id: client.tax_id || '',
    website: client.website || '',
    phone: client.phone || '',
    notes: client.notes || '',
    is_active: client.is_active,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('clients')
        .update({
          name: data.name,
          payment_terms: data.payment_terms || null,
          payment_terms_days: data.payment_terms_days ? parseInt(data.payment_terms_days.toString()) : null,
          billing_address: data.billing_address || null,
          tax_id: data.tax_id || null,
          website: data.website || null,
          phone: data.phone || null,
          notes: data.notes || null,
          is_active: data.is_active,
        })
        .eq('id', client.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', client.id] });
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Client Information</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-sm">{client.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Client Type</Label>
            <div>
              <Badge>{client.client_type.replace('_', ' ')}</Badge>
            </div>
          </div>

          {client.managing_agency && (
            <div className="space-y-2">
              <Label>Managing Agency</Label>
              <p className="text-sm">{client.managing_agency.name}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <div>
              <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                {formData.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Payment Terms</Label>
            {isEditing ? (
              <Input
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="e.g., Net 30"
              />
            ) : (
              <p className="text-sm">{client.payment_terms || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Payment Days</Label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.payment_terms_days}
                onChange={(e) => setFormData({ ...formData, payment_terms_days: e.target.value })}
                placeholder="e.g., 30"
              />
            ) : (
              <p className="text-sm">{client.payment_terms_days || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            {isEditing ? (
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            ) : (
              <p className="text-sm">{client.phone || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Website</Label>
            {isEditing ? (
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            ) : (
              <p className="text-sm">
                {client.website ? (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {client.website}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            )}
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Tax ID / EIN</Label>
            {isEditing ? (
              <Input
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            ) : (
              <p className="text-sm">{client.tax_id || '-'}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Billing Address</Label>
          {isEditing ? (
            <Textarea
              value={formData.billing_address}
              onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
              rows={3}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{client.billing_address || '-'}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Internal Notes</Label>
          {isEditing ? (
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{client.notes || '-'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
