import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Save, X } from 'lucide-react';

interface ClientPaymentSettingsProps {
  client: any;
}

export const ClientPaymentSettings = ({ client }: ClientPaymentSettingsProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    po_system_enabled: client.po_system_enabled || false,
    default_payment_method: client.default_payment_method || 'offline_check',
    offline_payment_instructions: client.offline_payment_instructions || '',
  });

  const updatePaymentSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('clients')
        .update({
          po_system_enabled: formData.po_system_enabled,
          default_payment_method: formData.default_payment_method,
          offline_payment_instructions: formData.offline_payment_instructions || null,
        })
        .eq('id', client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', client.id] });
      toast.success('Payment settings updated');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update payment settings');
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Payment Settings</CardTitle>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    po_system_enabled: client.po_system_enabled || false,
                    default_payment_method: client.default_payment_method || 'offline_check',
                    offline_payment_instructions: client.offline_payment_instructions || '',
                  });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updatePaymentSettings.mutate()}
                disabled={updatePaymentSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PO System Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="po-system">PO System</Label>
            <p className="text-sm text-muted-foreground">
              Enable purchase order requirement for this client
            </p>
          </div>
          {isEditing ? (
            <Switch
              id="po-system"
              checked={formData.po_system_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, po_system_enabled: checked })
              }
            />
          ) : (
            <span className="text-sm font-medium">
              {formData.po_system_enabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
        </div>

        {/* Default Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="payment-method">Default Payment Method</Label>
          {isEditing ? (
            <Select
              value={formData.default_payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, default_payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="stripe">Stripe (Online)</SelectItem>
                <SelectItem value="offline_direct_deposit">Offline - Direct Deposit</SelectItem>
                <SelectItem value="offline_check">Offline - Check</SelectItem>
                <SelectItem value="offline_cash">Offline - Cash</SelectItem>
                <SelectItem value="po_system">PO System</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">
              {formData.default_payment_method === 'stripe' && 'Stripe (Online)'}
              {formData.default_payment_method === 'offline_direct_deposit' && 'Offline - Direct Deposit'}
              {formData.default_payment_method === 'offline_check' && 'Offline - Check'}
              {formData.default_payment_method === 'offline_cash' && 'Offline - Cash'}
              {formData.default_payment_method === 'po_system' && 'PO System'}
            </p>
          )}
        </div>

        {/* Offline Payment Instructions */}
        {(formData.default_payment_method.startsWith('offline_') || !isEditing && client.offline_payment_instructions) && (
          <div className="space-y-2">
            <Label htmlFor="payment-instructions">Payment Instructions</Label>
            <p className="text-xs text-muted-foreground">
              Provide bank details, mailing address, or other payment information
            </p>
            {isEditing ? (
              <Textarea
                id="payment-instructions"
                value={formData.offline_payment_instructions}
                onChange={(e) =>
                  setFormData({ ...formData, offline_payment_instructions: e.target.value })
                }
                placeholder="Example: Mail checks to: 123 Main St, City, State 12345"
                rows={4}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                {client.offline_payment_instructions || 'No instructions provided'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
