import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Employee = Database['public']['Tables']['employees']['Row'];

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  onSuccess: () => void;
}

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  employment_type: string;
  salary_type: string;
  salary_amount: string;
  start_date: string;
  notes: string;
}

export const EmployeeDialog = ({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salaryType, setSalaryType] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm<EmployeeFormData>();

  useEffect(() => {
    if (employee) {
      setValue('first_name', employee.first_name);
      setValue('last_name', employee.last_name);
      setValue('email', employee.email);
      setValue('phone', employee.phone || '');
      setValue('position', employee.position);
      setValue('employment_type', employee.employment_type);
      setValue('salary_type', employee.salary_type);
      setValue('salary_amount', employee.salary_amount.toString());
      setValue('start_date', employee.start_date);
      setValue('notes', employee.notes || '');
      setSalaryType(employee.salary_type as 'weekly' | 'monthly' | 'annual');
      setSalaryAmount(employee.salary_amount.toString());
      const formatted = formatSalaryInput(employee.salary_amount.toString());
      setDisplayAmount(formatted);
    } else {
      reset();
      setSalaryType('monthly');
      setSalaryAmount('');
      setDisplayAmount('');
    }
  }, [employee, reset, setValue]);

  // Format salary with commas as user types
  const formatSalaryInput = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    // Split into integer and decimal parts
    const parts = cleaned.split('.');
    // Add commas to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Rejoin with decimal (limit to 2 decimal places)
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove commas to get raw number
    const rawValue = inputValue.replace(/,/g, '');
    // Format for display
    const formatted = formatSalaryInput(rawValue);
    setDisplayAmount(formatted);
    setSalaryAmount(rawValue);
    setValue('salary_amount', rawValue);
  };

  // Calculate other salary amounts based on input
  const calculateSalaries = (amount: string, type: 'weekly' | 'monthly' | 'annual') => {
    const num = parseFloat(amount) || 0;
    if (num === 0) return { weekly: 0, monthly: 0, annual: 0 };

    switch (type) {
      case 'weekly':
        return {
          weekly: num,
          monthly: (num * 52) / 12,
          annual: num * 52,
        };
      case 'monthly':
        return {
          weekly: (num * 12) / 52,
          monthly: num,
          annual: num * 12,
        };
      case 'annual':
        return {
          weekly: num / 52,
          monthly: num / 12,
          annual: num,
        };
    }
  };

  const salaries = calculateSalaries(salaryAmount, salaryType);

  const onSubmit = async (data: EmployeeFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const employeeData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        position: data.position,
        employment_type: data.employment_type,
        salary_type: salaryType,
        salary_amount: parseFloat(salaryAmount),
        start_date: data.start_date,
        notes: data.notes || null,
        created_by: user.id,
      };

      if (employee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employee.id);

        if (error) throw error;
        toast.success('Employee updated successfully');
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);

        if (error) throw error;
        toast.success('Employee added successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error(error.message || 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Edit Employee' : 'Add Employee'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name', { required: true })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name', { required: true })}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: true })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Position and Employment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                {...register('position', { required: true })}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type *</Label>
              <Select
                onValueChange={(value) => setValue('employment_type', value)}
                defaultValue={employee?.employment_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary Fields */}
          <div className="space-y-2">
            <Label>Salary *</Label>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={salaryType}
                onValueChange={(value: 'weekly' | 'monthly' | 'annual') => {
                  setSalaryType(value);
                  setValue('salary_type', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                value={displayAmount}
                onChange={handleSalaryChange}
                placeholder="0.00"
              />
            </div>
            {salaryAmount && (
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                <p>Weekly: ${salaries.weekly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Monthly: ${salaries.monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Annual: ${salaries.annual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date', { required: true })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional information about the employee..."
              rows={3}
            />
          </div>

          {/* Actions */}
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
              {isSubmitting ? 'Saving...' : employee ? 'Update' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
