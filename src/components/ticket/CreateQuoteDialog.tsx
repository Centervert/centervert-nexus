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
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface CreateQuoteDialogProps {
  ticketId: string;
}

export const CreateQuoteDialog = ({ ticketId }: CreateQuoteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ticket_quotes')
        .insert({
          ticket_id: ticketId,
          amount: parseFloat(amount),
          status: 'awaiting_approval',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote created successfully');
      setOpen(false);
      setAmount('');
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
