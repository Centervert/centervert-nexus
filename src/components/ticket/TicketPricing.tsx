import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DollarSign, CheckCircle, XCircle, Clock, Pencil, X, Check, AlertTriangle, CreditCard, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { useStripeSetting } from '@/hooks/useSystemSettings';
import { useQuotePayment } from '@/hooks/useQuotePayment';
import { sendQuoteNotification, getTicketDetails, getUserDetails } from '@/lib/emailNotifications';
import { cn } from '@/lib/utils';

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
  is_recurring: boolean;
  billing_interval: string | null;
  billing_cycles: number | null;
  paid_at: string | null;
  stripe_session_id: string | null;
  payment_status: string | null;
  marked_paid_by: string | null;
  marked_paid_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approver?: {
    full_name: string;
    email: string;
  };
}

interface TicketPricingProps {
  ticketId: string;
}

export const TicketPricing = ({ ticketId }: TicketPricingProps) => {
  const queryClient = useQueryClient();
  const { data: userRole } = useUserRole();
  const { data: stripeEnabled } = useStripeSetting();
  const { markAsPaid } = useQuotePayment(ticketId);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDeliverables, setEditDeliverables] = useState('');
  const [showApprovedWarning, setShowApprovedWarning] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [dismissedPOWarning, setDismissedPOWarning] = useState(false);
  
  // Approval flow
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [showNoPOWarning, setShowNoPOWarning] = useState(false);
  
  // Decline flow
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [preferredAmount, setPreferredAmount] = useState('');
  const [declinedBy, setDeclinedBy] = useState('');
  
  // Cancel request flow
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRequestedBy, setCancelRequestedBy] = useState('');
  
  // Cancel dialog (within cancellation window)
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Delete quote dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch current user profile for auto-fill
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      return profile?.full_name || user.email || '';
    },
  });

  // Auto-fill user names when forms open
  useEffect(() => {
    if (currentUser) {
      if (showApprovalForm && !approvedBy) setApprovedBy(currentUser);
      if (showDeclineForm && !declinedBy) setDeclinedBy(currentUser);
      if (showCancelRequestDialog && !cancelRequestedBy) setCancelRequestedBy(currentUser);
      if (showCancelDialog && !cancelRequestedBy) setCancelRequestedBy(currentUser);
    }
  }, [currentUser, showApprovalForm, showDeclineForm, showCancelRequestDialog, showCancelDialog]);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['ticket-quote', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_quotes')
        .select(`
          *,
          approver:profiles!approved_by(full_name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      
      return data as Quote | null;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Initialize edit form when quote loads
  useEffect(() => {
    if (quote) {
      setEditAmount(quote.amount.toString());
      setEditDeliverables(quote.deliverables?.join('\n') || '');
    }
  }, [quote]);

  // Real-time subscription for quote updates
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-quote-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_quotes',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  // Update countdown timer
  useEffect(() => {
    if (!quote?.approval_window_expires_at || quote.status === 'cancelled') return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(quote.approval_window_expires_at!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('');
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quote]);

  const handleApprove = async (bypassPOWarning = false) => {
    if (!quote) return;

    // Show warning if no PO and not bypassing
    if (!poNumber.trim() && !bypassPOWarning) {
      setShowNoPOWarning(true);
      return;
    }

    if (!approvedBy.trim()) {
      toast.error('Please enter who approved this quote');
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          status: 'approved',
          po_number: poNumber.trim() || null,
          approval_window_expires_at: expiresAt,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (error) throw error;

      // Send email notification
      const ticketDetails = await getTicketDetails(ticketId);
      if (ticketDetails) {
        // Notify agents/admins about the approval
        const { data: agents } = await supabase
          .from('user_roles')
          .select('user_id, profiles!inner(email, full_name)')
          .in('role', ['admin', 'agent']);

        agents?.forEach(async (agent: any) => {
          await sendQuoteNotification({
            to_email: agent.profiles.email,
            to_name: agent.profiles.full_name || agent.profiles.email,
            ticket_number: ticketDetails.ticket_number,
            ticket_title: ticketDetails.title,
            ticket_id: ticketId,
            quote_amount: quote.amount,
            event_type: 'approved',
            actor_name: approvedBy,
            deliverables: quote.deliverables || undefined,
          });
        });
      }

      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote approved successfully');
      setShowApprovalForm(false);
      setPoNumber('');
      setApprovedBy('');
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

    if (!declinedBy.trim()) {
      toast.error('Please enter who declined this quote');
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

      // Send email notification
      const ticketDetails = await getTicketDetails(ticketId);
      if (ticketDetails) {
        // Notify agents/admins about the decline
        const { data: agents } = await supabase
          .from('user_roles')
          .select('user_id, profiles!inner(email, full_name)')
          .in('role', ['admin', 'agent']);

        agents?.forEach(async (agent: any) => {
          await sendQuoteNotification({
            to_email: agent.profiles.email,
            to_name: agent.profiles.full_name || agent.profiles.email,
            ticket_number: ticketDetails.ticket_number,
            ticket_title: ticketDetails.title,
            ticket_id: ticketId,
            quote_amount: quote.amount,
            event_type: 'declined',
            actor_name: declinedBy,
            deliverables: quote.deliverables || undefined,
          });
        });
      }

      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote declined');
      setShowDeclineForm(false);
      setDeclineReason('');
      setPreferredAmount('');
      setDeclinedBy('');
    } catch (error) {
      console.error('Error declining quote:', error);
      toast.error('Failed to decline quote');
    }
  };

  const submitCancel = async () => {
    if (!quote || !cancelReason.trim() || !cancelRequestedBy.trim()) {
      toast.error('Please provide reason and your name');
      return;
    }

    try {
      // Create milestone for the cancellation
      await supabase
        .from('ticket_milestones')
        .insert({
          ticket_id: ticketId,
          type: 'approval_cancelled',
          title: `Approval cancelled by ${cancelRequestedBy}`,
          description: cancelReason,
          person_name: cancelRequestedBy,
          status: 'completed',
        });

      // Reset quote to awaiting approval
      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          status: 'awaiting_approval',
          approval_window_expires_at: null,
          decline_reason: `Last approval cancelled by ${cancelRequestedBy}: ${cancelReason}`,
        })
        .eq('id', quote.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Approval cancelled - returned to awaiting approval');
      setShowCancelDialog(false);
      setCancelReason('');
      setCancelRequestedBy('');
    } catch (error) {
      console.error('Error cancelling approval:', error);
      toast.error('Failed to cancel approval');
    }
  };

  const handleCancelRequest = async () => {
    if (!quote || !cancelReason.trim() || !cancelRequestedBy.trim()) {
      toast.error('Please provide reason and your name');
      return;
    }

    try {
      // Create milestone for the cancellation request
      await supabase
        .from('ticket_milestones')
        .insert({
          ticket_id: ticketId,
          type: 'cancellation_requested',
          title: `Cancellation requested by ${cancelRequestedBy}`,
          description: cancelReason,
          person_name: cancelRequestedBy,
          status: 'completed',
        });

      // Reset quote to awaiting approval
      const { error } = await supabase
        .from('ticket_quotes')
        .update({
          status: 'awaiting_approval',
          decline_reason: `Cancellation requested by ${cancelRequestedBy}: ${cancelReason}`,
          approval_window_expires_at: null,
        })
        .eq('id', quote.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Cancellation request submitted - returned to awaiting approval');
      setShowCancelRequestDialog(false);
      setCancelReason('');
      setCancelRequestedBy('');
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      toast.error('Failed to submit cancellation request');
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!quote) return;

      const { error } = await supabase
        .from('ticket_quotes')
        .update({ status: newStatus })
        .eq('id', quote.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const addPOMutation = useMutation({
    mutationFn: async (po: string) => {
      if (!quote) return;

      const { error } = await supabase
        .from('ticket_quotes')
        .update({ po_number: po })
        .eq('id', quote.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('PO number added');
    },
    onError: () => {
      toast.error('Failed to add PO number');
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async (keepApproved: boolean) => {
      if (!quote) return;

      const deliverables = editDeliverables
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const updates: any = {
        amount: parseFloat(editAmount),
        deliverables: deliverables.length > 0 ? deliverables : null,
      };

      // If not keeping approved status and quote was approved, reset to awaiting_approval
      if (!keepApproved && quote.status === 'approved') {
        updates.status = 'awaiting_approval';
        updates.po_number = null;
        updates.approval_window_expires_at = null;
      }

      const { error } = await supabase
        .from('ticket_quotes')
        .update(updates)
        .eq('id', quote.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      toast.success('Quote updated successfully');
      setIsEditingQuote(false);
      setShowSaveDialog(false);
    },
    onError: () => {
      toast.error('Failed to update quote');
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!quote) return;

      // First, delete all quote-related milestones
      const { error: milestonesError } = await supabase
        .from('ticket_milestones')
        .delete()
        .eq('ticket_id', ticketId)
        .in('type', ['approval_requested', 'approval_approved', 'approval_declined', 'approval_cancelled', 'cancellation_requested']);

      if (milestonesError) throw milestonesError;

      // Then delete the quote
      const { error: quoteError } = await supabase
        .from('ticket_quotes')
        .delete()
        .eq('id', quote.id);

      if (quoteError) throw quoteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-quote', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-milestones', ticketId] });
      toast.success('Quote and related milestones deleted successfully');
      setShowDeleteDialog(false);
      setIsEditingQuote(false);
    },
    onError: (error) => {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    },
  });

  const handleEditClick = () => {
    if (quote?.status === 'approved') {
      setShowApprovedWarning(true);
    } else {
      setIsEditingQuote(true);
    }
  };

  const handleSaveClick = () => {
    if (quote?.status === 'approved') {
      setShowSaveDialog(true);
    } else {
      updateQuoteMutation.mutate(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePayWithStripe = async () => {
    if (!quote) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          quote_id: quote.id,
          success_url: `${window.location.origin}/tickets/${ticketId}?payment=success`,
          cancel_url: `${window.location.origin}/tickets/${ticketId}?payment=cancelled`,
        },
      });

      if (error) throw error;

      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create payment session');
    }
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
    quote?.approval_window_expires_at &&
    new Date(quote.approval_window_expires_at) > new Date();

  const needsPO = quote?.status === 'approved' && !quote?.po_number && !dismissedPOWarning;

  // Check if there was a previous cancellation
  const hasPreviousCancellation = quote?.decline_reason?.includes('cancelled') || quote?.decline_reason?.includes('Cancellation');

  return (
    <>
      {/* Cancel Dialog (within cancellation window) */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for cancelling this approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-dialog-reason">Reason *</Label>
              <Textarea
                id="cancel-dialog-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling this approval?"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cancel-dialog-by">Cancelled By *</Label>
              <Input
                id="cancel-dialog-by"
                value={cancelRequestedBy}
                onChange={(e) => setCancelRequestedBy(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitCancel}
              disabled={!cancelReason.trim() || !cancelRequestedBy.trim()}
            >
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Request Dialog */}
      <AlertDialog open={showCancelRequestDialog} onOpenChange={setShowCancelRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request to Cancel Approval</AlertDialogTitle>
            <AlertDialogDescription>
              The cancellation window has expired. Please provide a reason for the cancellation request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-reason">Reason *</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why are you requesting cancellation?"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cancel-requested-by">Requested By *</Label>
              <Input
                id="cancel-requested-by"
                value={cancelRequestedBy}
                onChange={(e) => setCancelRequestedBy(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              disabled={!cancelReason.trim() || !cancelRequestedBy.trim()}
            >
              Submit Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* No PO Warning Dialog */}
      <AlertDialog open={showNoPOWarning} onOpenChange={setShowNoPOWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Approve Without PO Number?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are approving this quote without a PO number. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowNoPOWarning(false);
              handleApprove(true);
            }}>
              Approve Without PO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Warning Dialog for Editing Approved Quote */}
      <AlertDialog open={showApprovedWarning} onOpenChange={setShowApprovedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Edit Approved Quote
            </AlertDialogTitle>
            <AlertDialogDescription>
              This quote has already been approved. Editing it may require customer reapproval. 
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setIsEditingQuote(true)}>
              Continue Editing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Dialog - Choose Approval Status */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How would you like to save this quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This quote was previously approved. Choose how to handle the approval status:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Button
              className="w-full justify-start text-left h-auto py-4"
              variant="outline"
              onClick={() => updateQuoteMutation.mutate(false)}
              disabled={updateQuoteMutation.isPending}
            >
              <div>
                <div className="font-semibold">Require Reapproval</div>
                <div className="text-sm text-muted-foreground">
                  Customer must approve the new quote amount
                </div>
              </div>
            </Button>
            <Button
              className="w-full justify-start text-left h-auto py-4"
              variant="outline"
              onClick={() => updateQuoteMutation.mutate(true)}
              disabled={updateQuoteMutation.isPending}
            >
              <div>
                <div className="font-semibold">Keep Pre-Approved</div>
                <div className="text-sm text-muted-foreground">
                  Save changes without requiring new approval
                </div>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateQuoteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Quote Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Quote Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quote and all related milestones. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQuoteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuoteMutation.mutate()}
              disabled={deleteQuoteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteQuoteMutation.isPending ? 'Deleting...' : 'Delete Quote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className={cn(needsPO && 'relative')}>
        {needsPO && (
          <div className="absolute inset-0 bg-red-50/80 border-2 border-red-200 rounded-lg flex items-center justify-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 max-w-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                  <p className="font-semibold">Missing PO Number</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissedPOWarning(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This quote was approved without a PO number. Please add one.
              </p>
              <div className="space-y-2">
                <Input
                  placeholder="Enter PO number"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && poNumber.trim()) {
                      addPOMutation.mutate(poNumber.trim());
                      setPoNumber('');
                      setDismissedPOWarning(true);
                    }
                  }}
                />
                <Button
                  className="w-full"
                  onClick={() => {
                    if (poNumber.trim()) {
                      addPOMutation.mutate(poNumber.trim());
                      setPoNumber('');
                      setDismissedPOWarning(true);
                    }
                  }}
                  disabled={!poNumber.trim() || addPOMutation.isPending}
                >
                  {addPOMutation.isPending ? 'Adding...' : 'Add PO Number'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Quote & Pricing
            </CardTitle>
            <div className="flex items-center gap-2">
              {userRole?.isAdmin && (
                <Select
                  value={quote.status}
                  onValueChange={(value) => updateStatusMutation.mutate(value)}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {userRole?.isAdmin && !isEditingQuote && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Quote
                </Button>
              )}
              {isEditingQuote && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
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
                    onClick={handleSaveClick}
                    disabled={updateQuoteMutation.isPending}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {updateQuoteMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
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
                {quote.is_recurring && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Billed {quote.billing_interval}
                    {quote.billing_cycles && ` for ${quote.billing_cycles} cycle${quote.billing_cycles > 1 ? 's' : ''}`}
                    {!quote.billing_cycles && ' (ongoing)'}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  className={
                    quote.status === 'approved'
                      ? 'bg-blue-500'
                      : quote.status === 'declined'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }
                >
                  {quote.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                </Badge>
                
                {quote.status === 'approved' && quote.payment_status === 'paid' && (
                  <div className="relative">
                    <Badge className="bg-green-600 text-white font-bold px-4 py-2 text-sm shadow-lg">
                      ✓ PAID
                    </Badge>
                  </div>
                )}
                {quote.status === 'approved' && userRole?.isAdmin && quote.payment_status !== 'paid' && (
                  <Select
                    value={quote.payment_status || 'unpaid'}
                    onValueChange={(value) => {
                      if (value === 'paid') {
                        markAsPaid.mutate(quote.id);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Mark as Paid</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
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
            
            {/* PO Number Display */}
            {quote.po_number && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  PO Number: <span className="font-mono">{quote.po_number}</span>
                </p>
              </div>
            )}

            {/* Awaiting Approval State */}
            {quote.status === 'awaiting_approval' && (
              <div className="space-y-4">
                {!showApprovalForm && !showDeclineForm && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowApprovalForm(true)}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {hasPreviousCancellation ? 'Approve (last approval cancelled)' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => setShowDeclineForm(true)}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                )}

                {showApprovalForm && (
                  <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-green-900">Approve Quote</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowApprovalForm(false);
                          setPoNumber('');
                          setApprovedBy('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="po-number">PO Number (Optional)</Label>
                        <Input
                          id="po-number"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          placeholder="Enter PO number"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="approved-by">Approved By *</Label>
                        <Input
                          id="approved-by"
                          value={approvedBy}
                          onChange={(e) => setApprovedBy(e.target.value)}
                          placeholder="Enter approver name"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => handleApprove()}
                        disabled={!approvedBy.trim()}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Confirm Approval
                      </Button>
                    </div>
                  </div>
                )}

                {showDeclineForm && (
                  <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-red-900">Decline Quote</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeclineForm(false);
                          setDeclineReason('');
                          setPreferredAmount('');
                          setDeclinedBy('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="decline-reason">Decline Reason *</Label>
                        <Textarea
                          id="decline-reason"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="Why are you declining this quote?"
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferred-amount">Preferred Amount (Optional)</Label>
                        <Input
                          id="preferred-amount"
                          type="number"
                          step="0.01"
                          value={preferredAmount}
                          onChange={(e) => setPreferredAmount(e.target.value)}
                          placeholder="Enter your preferred amount"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="declined-by">Declined By *</Label>
                        <Input
                          id="declined-by"
                          value={declinedBy}
                          onChange={(e) => setDeclinedBy(e.target.value)}
                          placeholder="Enter decliner name"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleDecline}
                        variant="destructive"
                        className="w-full"
                        disabled={!declineReason.trim() || !declinedBy.trim()}
                      >
                        Confirm Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Approved State */}
            {quote.status === 'approved' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                  <p className="text-sm font-medium text-green-900">
                    Quote Approved{quote.approver?.full_name && ` by ${quote.approver.full_name}`}
                  </p>
                  {quote.po_number && (
                    <p className="text-sm text-green-700">PO Number: {quote.po_number}</p>
                  )}
                  {quote.paid_at && (
                    <p className="text-sm text-green-700">Paid on: {format(new Date(quote.paid_at), 'MMM dd, yyyy')}</p>
                  )}
                </div>
                
                {/* Payment Button */}
                {stripeEnabled && !quote.paid_at && !quote.is_recurring && (
                  <Button
                    onClick={handlePayWithStripe}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay {formatCurrency(quote.amount)} with Stripe
                  </Button>
                )}
                
                {isWithinCancellationWindow ? (
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    variant="destructive"
                    className="w-full gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <Clock className="h-4 w-4" />
                    Cancel Approval ({timeRemaining} remaining)
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowCancelRequestDialog(true)}
                    className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Request to Cancel Approval
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
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <Clock className="h-4 w-4" />
                    Cancel Decline ({timeRemaining} remaining)
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </>
  );
};
