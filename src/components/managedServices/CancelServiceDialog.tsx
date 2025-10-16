import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CancelServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
}

export const CancelServiceDialog = ({
  open,
  onOpenChange,
  serviceId,
  serviceName,
}: CancelServiceDialogProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('managed_services')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['managed-services'] });
      queryClient.invalidateQueries({ queryKey: ['managed-services-stats'] });
      toast.success('Service cancelled successfully');
      onOpenChange(false);
      navigate('/managed-services');
    },
    onError: (error) => {
      console.error('Error cancelling service:', error);
      toast.error('Failed to cancel service');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Managed Service</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel "{serviceName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Cancellation Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Please provide a reason for cancellation..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Keep Service
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || !reason.trim()}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Service'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
