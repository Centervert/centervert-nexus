import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, User } from 'lucide-react';

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  position: string;
  salary_amount: number;
  salary_type: string;
  country: string;
};

type EmployeeCost = {
  id: string;
  income_id: string;
  employee_id: string;
  allocation_percentage: number;
  notes: string | null;
  employee?: Employee;
};

interface IncomeEmployeeCostsProps {
  incomeId: string;
}

export function IncomeEmployeeCosts({ incomeId }: IncomeEmployeeCostsProps) {
  const [employeeCosts, setEmployeeCosts] = useState<EmployeeCost[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('100');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch employee costs for this income
      const { data: costs, error: costsError } = await supabase
        .from('income_employee_costs' as any)
        .select('*')
        .eq('income_id', incomeId);

      if (costsError) throw costsError;

      // Fetch all active employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees' as any)
        .select('id, first_name, last_name, nickname, position, salary_amount, salary_type, country')
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      const employeesList = (employees || []) as unknown as Employee[];

      // Get already linked employee IDs
      const linkedEmployeeIds = (costs || []).map((c: any) => c.employee_id);

      // Filter available employees (not already linked)
      setAvailableEmployees(
        employeesList.filter((e) => !linkedEmployeeIds.includes(e.id))
      );

      // Enrich employee costs with employee details
      const enrichedCosts = (costs || []).map((c: any) => {
        const employee = employeesList.find((e) => e.id === c.employee_id);
        return { ...c, employee };
      });

      setEmployeeCosts(enrichedCosts);
    } catch (error) {
      console.error('Error fetching employee costs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [incomeId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMonthlyRate = (employee: Employee) => {
    const { salary_amount, salary_type } = employee;
    switch (salary_type) {
      case 'weekly':
        return (salary_amount * 52) / 12;
      case 'annual':
        return salary_amount / 12;
      case 'monthly':
      default:
        return salary_amount;
    }
  };

  const getDisplayName = (employee: Employee) => {
    if (employee.nickname) {
      return `${employee.nickname} (${employee.first_name} ${employee.last_name})`;
    }
    return `${employee.first_name} ${employee.last_name}`;
  };

  const handleAddEmployee = async () => {
    if (!selectedEmployeeId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('income_employee_costs' as any)
        .insert({
          income_id: incomeId,
          employee_id: selectedEmployeeId,
          allocation_percentage: parseFloat(allocationPercentage) || 100,
          created_by: user?.id,
        });

      if (error) throw error;

      setSelectedEmployeeId('');
      setAllocationPercentage('100');
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const handleRemoveEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('income_employee_costs' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error removing employee:', error);
    }
  };

  const totalEmployeeCosts = employeeCosts.reduce((sum, item) => {
    if (item.employee) {
      const monthlyRate = getMonthlyRate(item.employee);
      return sum + (monthlyRate * (item.allocation_percentage / 100));
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Employee Costs</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Employee
        </Button>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an employee..." />
            </SelectTrigger>
            <SelectContent>
              {availableEmployees.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No available employees
                </div>
              ) : (
                availableEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      {employee.country === 'Philippines' && <span>🇵🇭</span>}
                      {getDisplayName(employee)} - {employee.position}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <div>
            <label className="text-xs text-muted-foreground">Allocation %</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={allocationPercentage}
              onChange={(e) => setAllocationPercentage(e.target.value)}
              placeholder="100"
            />
          </div>
          
          <Button 
            onClick={handleAddEmployee} 
            disabled={!selectedEmployeeId}
            size="sm"
          >
            Add Employee
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : employeeCosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employee costs assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {employeeCosts.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-background"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {item.employee?.country === 'Philippines' && <span>🇵🇭</span>}
                    {item.employee ? getDisplayName(item.employee) : 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.employee?.position} • {item.allocation_percentage}% allocated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.employee && (
                      <>
                        {formatCurrency(getMonthlyRate(item.employee))}/mo
                        {item.allocation_percentage !== 100 && (
                          <> → {formatCurrency(getMonthlyRate(item.employee) * (item.allocation_percentage / 100))}/mo allocated</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveEmployee(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          
          <div className="flex justify-between pt-2 border-t">
            <span className="text-sm font-medium">Total Employee Costs (Monthly)</span>
            <span className="text-sm font-medium">{formatCurrency(totalEmployeeCosts)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
