import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Income } from './IncomeTable';

type IncomeInsert = Omit<Income, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: Income;
  onSuccess: () => void;
}

export function IncomeDialog({ open, onOpenChange, income, onSuccess }: IncomeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');
  const { register, handleSubmit, setValue, watch, reset } = useForm<IncomeInsert>({
    defaultValues: {
      name: '',
      type: 'Retainer',
      status: 'projected',
      amount: 0,
      frequency: 'monthly',
      projected_start_date: '',
      end_date: '',
      notes: '',
    },
  });

  const frequency = watch('frequency');
  const status = watch('status');
  const type = watch('type');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const numValue = parseFloat(value) || 0;
    setValue('amount', numValue);
    setAmountDisplay(value);
  };

  const handleAmountBlur = () => {
    const amount = watch('amount');
    if (amount > 0) {
      setAmountDisplay(formatCurrency(amount));
    }
  };

  const handleAmountFocus = () => {
    const amount = watch('amount');
    if (amount > 0) {
      setAmountDisplay(amount.toString());
    }
  };

  useEffect(() => {
    if (income) {
      setValue('name', income.name);
      setValue('type', income.type);
      setValue('status', income.status);
      setValue('amount', income.amount);
      setValue('frequency', income.frequency);
      setValue('projected_start_date', income.projected_start_date || '');
      setValue('end_date', income.end_date || '');
      setValue('notes', income.notes || '');
      setAmountDisplay(formatCurrency(income.amount));
    } else {
      reset();
      setAmountDisplay('');
    }
  }, [income, setValue, reset]);

  const onSubmit = async (data: IncomeInsert) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const submitData = {
        ...data,
        projected_start_date: data.projected_start_date || null,
        end_date: data.end_date || null,
      };

      if (income) {
        const { error } = await supabase
          .from('income' as any)
          .update(submitData)
          .eq('id', income.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('income' as any)
          .insert([{ ...submitData, created_by: user.id }]);

        if (error) throw error;
      }

      toast.success(income ? 'Income updated successfully' : 'Income created successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error saving income:', error);
      toast.error(error?.message || 'Failed to save income. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{income ? 'Edit Income Source' : 'Add New Income Source'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Income Name *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder="e.g., Client Retainer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retainer">Retainer</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Recurring Service">Recurring Service</SelectItem>
                  <SelectItem value="One-Time">One-Time</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as 'verified' | 'projected')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Verified
                    </span>
                  </SelectItem>
                  <SelectItem value="projected">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Projected
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="text"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  onFocus={handleAmountFocus}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={frequency}
                onValueChange={(value) => setValue('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-Time</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projected_start_date">Projected Start Date</Label>
              <Input
                id="projected_start_date"
                type="date"
                {...register('projected_start_date')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
              />
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional details about this income source..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : income ? 'Update Income' : 'Create Income'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
