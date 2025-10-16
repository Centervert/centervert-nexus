import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, XCircle, Upload, Clock, Pencil, X, Check } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';

interface Quote {
  id: string;
  amount: number;
  status: string;
  approval_window_expires_at: string | null;
  po_number: string | null;
  po_file_url: string | null;
  decline_reason: string | null;
  preferred_amount: number | null;
  deliverables: string[] | null;
}

interface TicketPricingProps {
  ticketId: string;
}

export const TicketPricing = ({ ticketId }: TicketPricingProps) => {
  const queryClient = useQueryClient();
  const { data: userRole } = useUserRole();
  const [poNumber, setPoNumber] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [preferredAmount, setPreferredAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDeliverables, setEditDeliverables] = useState('');

  const { data: quote, isLoading } = useQuery({
    queryKey: ['ticket-quote', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_quotes')
        .select('*')
        .eq('ticket_id', ticketId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Initialize edit form when quote loads
      if (data) {
        setEditAmount(data.amount.toString());
        setEditDeliverables(data.deliverables?.join('\n') || '');
      }
      
      return data as Quote | null;
    },
  });

  // Update countdown timer
  useEffect(() => {
    if (!quote?.approval_window_expires_at || quote.status === 'cancelled') return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(quote.approval_window_expires_at!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s remaining`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quote]);

  const handleApprove = async () => {
    if (!quote || !poNumber.trim()) {
      toast.error('Please enter a PO number');
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          status: 'approved',
          po_number: poNumber.trim(),
          approval_window_expires_at: expiresAt,
        })
        .eq('id', quote.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote approved successfully');
      setPoNumber('');
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.error('Failed to approve quote');
    }
  };

  const handleDecline = async () => {
    if (!quote || !declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          status: 'declined',
          decline_reason: declineReason.trim(),
          preferred_amount: preferredAmount ? parseFloat(preferredAmount) : null,
          approval_window_expires_at: expiresAt,
        })
        .eq('id', quote.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote declined');
      setDeclineReason('');
      setPreferredAmount('');
    } catch (error) {
      console.error('Error declining quote:', error);
      toast.error('Failed to decline quote');
    }
  };

  const handleCancel = async () => {
    if (!quote) return;

    try {
      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          status: 'cancelled',
          approval_window_expires_at: null,
        })
        .eq('id', quote.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Approval cancelled');
    } catch (error) {
      console.error('Error cancelling approval:', error);
      toast.error('Failed to cancel approval');
    }
  };

  const updateQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!quote) return;

      const deliverables = editDeliverables
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          amount: parseFloat(editAmount),
          deliverables: deliverables.length > 0 ? deliverables : null,
        })
        .eq('id', quote.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote updated successfully');
      setIsEditingQuote(false);
    },
    onError: () => {
      toast.error('Failed to update quote');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading quote information...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return null;
  }

  const isWithinCancellationWindow =
    quote.approval_window_expires_at &&
    new Date(quote.approval_window_expires_at) > new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Quote & Pricing
          </CardTitle>
          {userRole?.isAdmin && !isEditingQuote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingQuote(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Quote
            </Button>
          )}
          {isEditingQuote && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingQuote(false);
                  if (quote) {
                    setEditAmount(quote.amount.toString());
                    setEditDeliverables(quote.deliverables?.join('\n') || '');
                  }
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updateQuoteMutation.mutate()}
                disabled={updateQuoteMutation.isPending}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {updateQuoteMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditingQuote ? (
          // Edit Mode
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-amount">Quote Amount ($)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-deliverables">Expected Deliverables (one per line)</Label>
              <Textarea
                id="edit-deliverables"
                value={editDeliverables}
                onChange={(e) => setEditDeliverables(e.target.value)}
                placeholder="Enter each deliverable on a new line"
                rows={6}
                className="mt-1"
              />
            </div>
          </div>
        ) : (
          // View Mode
          <>
            {/* Quote Amount */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Quote Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(quote.amount)}</p>
              </div>
              <Badge
                className={
                  quote.status === 'approved'
                    ? 'bg-green-500'
                    : quote.status === 'declined'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }
              >
                {quote.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Timer */}
            {isWithinCancellationWindow && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{timeRemaining}</span>
              </div>
            )}

            {/* Deliverables */}
            {quote.deliverables && quote.deliverables.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Expected Deliverables:</p>
                <ul className="space-y-1">
                  {quote.deliverables.map((item, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Awaiting Approval State */}
            {quote.status === 'awaiting_approval' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="po-number">PO Number (Required to Approve)</Label>
                  <Input
                    id="po-number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Enter PO number"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleApprove} className="flex-1 gap-2" disabled={!poNumber.trim()}>
                    <CheckCircle className="h-4 w-4" />
                    Approve Quote
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Label htmlFor="decline-reason">Decline Reason</Label>
                  <Textarea
                    id="decline-reason"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Why are you declining this quote?"
                    className="min-h-[80px]"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="preferred-amount">Preferred Amount (Optional)</Label>
                    <Input
                      id="preferred-amount"
                      type="number"
                      value={preferredAmount}
                      onChange={(e) => setPreferredAmount(e.target.value)}
                      placeholder="Enter your preferred amount"
                    />
                  </div>
                  <Button
                    onClick={handleDecline}
                    variant="destructive"
                    className="w-full gap-2"
                    disabled={!declineReason.trim()}
                  >
                    <XCircle className="h-4 w-4" />
                    Decline Quote
                  </Button>
                </div>
              </div>
            )}

            {/* Approved State */}
            {quote.status === 'approved' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                  <p className="text-sm font-medium text-green-900">Quote Approved</p>
                  <p className="text-sm text-green-700">PO Number: {quote.po_number}</p>
                </div>
                {isWithinCancellationWindow && (
                  <Button onClick={handleCancel} variant="outline" className="w-full">
                    Cancel Approval
                  </Button>
                )}
              </div>
            )}

            {/* Declined State */}
            {quote.status === 'declined' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md space-y-2">
                  <p className="text-sm font-medium text-red-900">Quote Declined</p>
                  {quote.decline_reason && (
                    <p className="text-sm text-red-700">Reason: {quote.decline_reason}</p>
                  )}
                  {quote.preferred_amount && (
                    <p className="text-sm text-red-700">
                      Preferred Amount: {formatCurrency(quote.preferred_amount)}
                    </p>
                  )}
                </div>
                {isWithinCancellationWindow && (
                  <Button onClick={handleCancel} variant="outline" className="w-full">
                    Cancel Decline
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
