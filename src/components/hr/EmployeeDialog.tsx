import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Plus, Calendar } from 'lucide-react';
import { EmployeeResourceManager } from './EmployeeResourceManager';

type Employee = Database['public']['Tables']['employees']['Row'];
type EmployeeRaise = Database['public']['Tables']['employee_raises']['Row'];
type EmployeeAttachment = Database['public']['Tables']['employee_attachments']['Row'];

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  onSuccess: () => void;
}

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  phone: string;
  position: string;
  employment_type: string;
  salary_type: string;
  salary_amount: string;
  start_date: string;
  country: string;
  address: string;
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
  const [employmentType, setEmploymentType] = useState('');
  const [showRaiseForm, setShowRaiseForm] = useState(false);
  const [editingRaiseId, setEditingRaiseId] = useState<string | null>(null);
  const [raiseData, setRaiseData] = useState({
    new_salary: '',
    salary_type: 'annually' as 'weekly' | 'monthly' | 'annually',
    effective_date: '',
    status: 'pending' as 'pending' | 'approved' | 'canceled',
    notes: ''
  });
  const [newSalaryDisplay, setNewSalaryDisplay] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm<EmployeeFormData>();

  // Fetch raises for this employee
  const { data: raises = [], refetch: refetchRaises } = useQuery({
    queryKey: ['employee-raises', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase
        .from('employee_raises')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmployeeRaise[];
    },
    enabled: !!employee?.id,
  });

  // Fetch effective compensation for this employee from the view
  const { data: compensation } = useQuery({
    queryKey: ['employee-compensation', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return null;
      const { data, error } = await supabase
        .from('employee_compensation')
        .select('annual, per_month, per_paycheck')
        .eq('id', employee.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!employee?.id,
  });

  // Fetch resources/attachments for this employee
  const { data: resources = [], refetch: refetchResources } = useQuery({
    queryKey: ['employee-resources', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase
        .from('employee_attachments')
        .select('*')
        .eq('employee_id', employee.id)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as EmployeeAttachment[];
    },
    enabled: !!employee?.id,
  });

  // Format new salary with commas
  const formatSalaryInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  const handleNewSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const rawValue = inputValue.replace(/,/g, '');
    const formatted = formatSalaryInput(rawValue);
    setNewSalaryDisplay(formatted);
    setRaiseData({ ...raiseData, new_salary: rawValue });
  };

  // Calculate raise amount (difference)
  const calculateRaiseAmount = () => {
    const currentSalary = Number(salaryAmount) || Number(employee?.salary_amount || 0);
    const newSalary = Number(raiseData.new_salary) || 0;
    return newSalary - currentSalary;
  };

  useEffect(() => {
    if (employee) {
      setValue('first_name', employee.first_name);
      setValue('last_name', employee.last_name);
      setValue('nickname', employee.nickname || '');
      setValue('email', employee.email);
      setValue('phone', employee.phone || '');
      setValue('position', employee.position);
      setValue('employment_type', employee.employment_type);
      setValue('salary_type', employee.salary_type);
      setValue('salary_amount', employee.salary_amount.toString());
      setValue('start_date', employee.start_date);
      setValue('country', employee.country);
      setValue('address', employee.address || '');
      setValue('notes', employee.notes || '');
      setEmploymentType(employee.employment_type);
      setSalaryType(employee.salary_type as 'weekly' | 'monthly' | 'annual');
      setSalaryAmount(employee.salary_amount.toString());
      const formatted = formatSalaryInput(employee.salary_amount.toString());
      setDisplayAmount(formatted);
    } else {
      reset();
      setEmploymentType('');
      setSalaryType('monthly');
      setSalaryAmount('');
      setDisplayAmount('');
      setValue('country', 'United States'); // Default to US
    }
  }, [employee, reset, setValue]);

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
        nickname: data.nickname || null,
        email: data.email,
        phone: data.phone || null,
        position: data.position,
        employment_type: employmentType,
        salary_type: salaryType,
        salary_amount: parseFloat(salaryAmount),
        start_date: data.start_date || null,
        country: data.country,
        address: data.address || null,
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

  const handleAddRaise = async () => {
    if (!employee?.id || !raiseData.new_salary || !raiseData.effective_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const currentSalary = Number(salaryAmount) || Number(employee?.salary_amount || 0);
      const newSalary = Number(raiseData.new_salary);
      const raiseAmount = newSalary - currentSalary;

      if (editingRaiseId) {
        // Update existing raise
        const { error } = await supabase
          .from('employee_raises')
          .update({
            current_salary: currentSalary,
            raise_amount: raiseAmount,
            new_salary: newSalary,
            effective_date: raiseData.effective_date,
            status: raiseData.status,
            notes: raiseData.notes || null,
            salary_type: raiseData.salary_type === 'annually' ? 'annual' : raiseData.salary_type,
          })
          .eq('id', editingRaiseId);

        if (error) throw error;
        toast.success('Raise updated successfully');
      } else {
        // Insert new raise
        const { error } = await supabase
          .from('employee_raises')
          .insert([{
            employee_id: employee.id,
            current_salary: currentSalary,
            raise_amount: raiseAmount,
            new_salary: newSalary,
            effective_date: raiseData.effective_date,
            status: raiseData.status,
            notes: raiseData.notes || null,
            created_by: user!.id,
            salary_type: raiseData.salary_type === 'annually' ? 'annual' : raiseData.salary_type,
          }]);

        if (error) throw error;
        toast.success('Raise added successfully');
      }

      setShowRaiseForm(false);
      setEditingRaiseId(null);
      setRaiseData({
        new_salary: '',
        salary_type: 'annually',
        effective_date: '',
        status: 'pending',
        notes: ''
      });
      setNewSalaryDisplay('');
      refetchRaises();
    } catch (error: any) {
      console.error('Error saving raise:', error);
      toast.error(error.message || 'Failed to save raise');
    }
  };

  const handleEditRaise = (raise: EmployeeRaise) => {
    setEditingRaiseId(raise.id);
    setRaiseData({
      new_salary: raise.new_salary.toString(),
      salary_type: 'annually',
      effective_date: raise.effective_date,
      status: raise.status as 'pending' | 'approved' | 'canceled',
      notes: raise.notes || ''
    });
    setNewSalaryDisplay(formatSalaryInput(raise.new_salary.toString()));
    setShowRaiseForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'canceled': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {employee ? 'Edit Employee' : 'Add Employee'}
          </SheetTitle>
          <SheetDescription>
            {employee ? 'Update employee information and manage salary raises.' : 'Add a new team member to your organization.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
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

          {/* Nickname Field */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              {...register('nickname')}
              placeholder="Preferred name or alias"
            />
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
                value={employmentType}
                onValueChange={(value) => {
                  setEmploymentType(value);
                  setValue('employment_type', value);
                }}
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
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="text"
                  value={displayAmount}
                  onChange={handleSalaryChange}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            {salaryAmount && (
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                <p>Per Paycheck: ${(salaries.monthly / 2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Per Month: ${salaries.monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Annual: ${salaries.annual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
            />
          </div>

          {/* Country and Address */}
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              onValueChange={(value) => setValue('country', value)}
              defaultValue={employee?.country || 'United States'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Philippines">Philippines</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address (Optional)</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Street address, city, state/province, postal code..."
              rows={2}
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

          {/* Raise Tracking Section - Only for existing employees */}
          {employee && (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Salary & Raises</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRaiseForm(!showRaiseForm)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Raise
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Salary Display */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Salary</p>
                  <p className="text-2xl font-bold">
                    ${Number(salaryAmount || employee.salary_amount).toLocaleString()}/{salaryType.charAt(0)}
                  </p>
                </div>

                {/* Add Raise Form */}
                {showRaiseForm && (
                  <div className="p-4 border rounded-lg space-y-3 bg-background">
                    <h4 className="font-medium">{editingRaiseId ? 'Edit Raise' : 'New Raise'}</h4>
                    <div className="space-y-2">
                      <Label>New Salary Amount</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="text"
                            value={newSalaryDisplay}
                            onChange={handleNewSalaryChange}
                            placeholder="0"
                            className="pl-7"
                          />
                        </div>
                        <Select
                          value={raiseData.salary_type}
                          onValueChange={(value: 'weekly' | 'monthly' | 'annually') => 
                            setRaiseData({ ...raiseData, salary_type: value })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {raiseData.new_salary && (
                        <div className="text-xs text-muted-foreground">
                          Raise Amount: ${Math.abs(calculateRaiseAmount()).toLocaleString()} 
                          {calculateRaiseAmount() < 0 ? ' (decrease)' : ' (increase)'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Effective Date</Label>
                      <Input
                        type="date"
                        value={raiseData.effective_date}
                        onChange={(e) => setRaiseData({ ...raiseData, effective_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={raiseData.status}
                        onValueChange={(value: 'pending' | 'approved' | 'canceled') => 
                          setRaiseData({ ...raiseData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        value={raiseData.notes}
                        onChange={(e) => setRaiseData({ ...raiseData, notes: e.target.value })}
                        placeholder="Notes about this raise..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleAddRaise} size="sm">
                        Save Raise
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowRaiseForm(false);
                          setEditingRaiseId(null);
                          setNewSalaryDisplay('');
                          setRaiseData({
                            new_salary: '',
                            salary_type: 'annually',
                            effective_date: '',
                            status: 'pending',
                            notes: ''
                          });
                        }} 
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Raises List */}
                {raises.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {raises.some(r => r.status === 'pending' || new Date(r.effective_date) > new Date()) 
                        ? 'Upcoming Raises' 
                        : 'Raise History'}
                    </h4>
                    <div className="space-y-2">
                      {raises.map((raise) => {
                        const raiseDate = new Date(raise.effective_date + 'T00:00:00');
                        const formattedDate = `${raiseDate.getMonth() + 1}/${raiseDate.getDate()}/${raiseDate.getFullYear()}`;
                        
                        return (
                          <div 
                            key={raise.id} 
                            className="p-3 border rounded-lg text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleEditRaise(raise)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formattedDate}</span>
                              </div>
                              <span className={`font-medium capitalize ${getStatusColor(raise.status)}`}>
                                {raise.status}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              ${raise.current_salary.toLocaleString()} → ${raise.new_salary.toLocaleString()}
                              <span className="text-green-600 ml-2">
                                (+${raise.raise_amount.toLocaleString()})
                              </span>
                            </div>
                            {raise.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{raise.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resources Section - Only for existing employees */}
          {employee && (
            <Card className="border-2">
              <CardContent className="pt-6">
                <EmployeeResourceManager
                  employeeId={employee.id}
                  resources={resources}
                  onResourcesChange={() => refetchResources()}
                />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <SheetFooter className="gap-2 sm:gap-0">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
