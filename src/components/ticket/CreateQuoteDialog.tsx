import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { sendQuoteNotification, getTicketDetails, getUserDetails } from '@/lib/emailNotifications';

interface CreateQuoteDialogProps {
  ticketId: string;
}

export const CreateQuoteDialog = ({ ticketId }: CreateQuoteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [billingInterval, setBillingInterval] = useState<string>('monthly');
  const [billingCycles, setBillingCycles] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const quoteData: any = {
        ticket_id: ticketId,
        amount: parseFloat(amount),
        status: 'awaiting_approval',
        is_recurring: isRecurring,
      };

      if (isRecurring) {
        quoteData.billing_interval = billingInterval;
        if (billingCycles) {
          quoteData.billing_cycles = parseInt(billingCycles);
        }
      }

      const { error } = await supabase
        .from('ticket_quotes')
        .insert(quoteData);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote created successfully');
      
      // Send email notification to ticket creator
      const ticketDetails = await getTicketDetails(ticketId);
      if (ticketDetails?.created_by) {
        const userDetails = await getUserDetails(ticketDetails.created_by);
        if (userDetails) {
          await sendQuoteNotification({
            to_email: userDetails.email,
            to_name: userDetails.full_name || userDetails.email,
            ticket_number: ticketDetails.ticket_number,
            ticket_title: ticketDetails.title,
            ticket_id: ticketId,
            quote_amount: parseFloat(amount),
            event_type: 'created',
          });
        }
      }
      
      setOpen(false);
      setAmount('');
      setIsRecurring(false);
      setBillingInterval('monthly');
      setBillingCycles('');
    },
    onError: () => {
      toast.error('Failed to create quote');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Add Quote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Quote</DialogTitle>
          <DialogDescription>Add a new quote for this ticket</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label
              htmlFor="recurring"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Recurring billing
            </Label>
          </div>

          {isRecurring && (
            <>
              <div>
                <Label htmlFor="interval">Billing Interval</Label>
                <Select value={billingInterval} onValueChange={setBillingInterval}>
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cycles">
                  Number of Billing Cycles{' '}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="cycles"
                  type="number"
                  min="1"
                  value={billingCycles}
                  onChange={(e) => setBillingCycles(e.target.value)}
                  placeholder="Leave empty for indefinite"
                />
              </div>
            </>
          )}

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!amount || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Quote'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
