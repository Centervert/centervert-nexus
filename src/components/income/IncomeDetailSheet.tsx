import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Income } from './IncomeTable';
import { IncomeAssociatedCosts } from './IncomeAssociatedCosts';
import { IncomeEmployeeCosts } from './IncomeEmployeeCosts';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
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

interface IncomeDetailSheetProps {
  income: Income | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function IncomeDetailSheet({ income, open, onOpenChange, onUpdate }: IncomeDetailSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStatusToggle = async () => {
    if (!income) return;
    try {
      const { error } = await supabase
        .from('income' as any)
        .update({ is_active: !income.is_active })
        .eq('id', income.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error toggling income status:', error);
    }
  };

  const handleDelete = async () => {
    if (!income) return;
    try {
      const { error } = await supabase
        .from('income' as any)
        .delete()
        .eq('id', income.id);

      if (error) throw error;
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting income:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (!income) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">{income.name}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Income Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm">{income.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`text-sm font-medium ${
                    income.status === 'verified' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {income.status === 'verified' ? 'Verified' : 'Projected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium">{formatCurrency(income.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="text-sm">{income.frequency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm">{formatDate(income.projected_start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="text-sm">{formatDate(income.end_date)}</p>
                </div>
              </div>
              
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity pt-2"
                onClick={handleStatusToggle}
              >
                {income.is_active ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Inactive</span>
                  </>
                )}
              </div>

              {income.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{income.notes}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Associated Costs Section */}
            <IncomeAssociatedCosts incomeId={income.id} />

            <Separator />

            {/* Employee Costs Section */}
            <IncomeEmployeeCosts incomeId={income.id} />

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <p className="text-xs text-muted-foreground">
                Deleting this income source will also remove all associated costs and employee assignments.
              </p>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Income Source
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{income?.name}"? This will also remove all associated costs and employee assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
