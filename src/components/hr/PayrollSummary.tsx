import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { addMonths, format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isAfter } from 'date-fns';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  salary_amount: number;
  salary_type: string;
  is_active: boolean;
  start_date: string | null;
}

interface Raise {
  id: string;
  employee_id: string;
  new_salary: number;
  effective_date: string;
  status: string;
}

interface FutureHire {
  id: string;
  first_name: string;
  last_name: string;
  salary_amount: number;
  salary_type: string;
  start_date: string;
}

export const PayrollSummary = () => {
  const today = new Date();
  const ninetyDaysOut = addMonths(today, 4);

  // Fetch all active employees (including future-dated ones that are marked active)
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, salary_amount, salary_type, is_active, start_date')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Employee[];
    },
  });

  const { data: raises = [] } = useQuery({
    queryKey: ['raises-payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_raises')
        .select('*')
        .gte('effective_date', format(today, 'yyyy-MM-dd'))
        .lte('effective_date', format(ninetyDaysOut, 'yyyy-MM-dd'))
        .eq('status', 'approved');
      
      if (error) throw error;
      return data as Raise[];
    },
  });

  // Separate current employees from future hires
  const currentEmployees = employees.filter(e => {
    if (!e.start_date) return true; // No start date = already employed
    return !isAfter(parseISO(e.start_date), today);
  });

  const futureHires = employees.filter(e => {
    if (!e.start_date) return false;
    const startDate = parseISO(e.start_date);
    return isAfter(startDate, today) && startDate <= ninetyDaysOut;
  }) as FutureHire[];

  // Normalize salary to monthly amount
  const normalizeToMonthly = (amount: number, type: string): number => {
    switch (type) {
      case 'weekly':
        return (amount * 52) / 12;
      case 'monthly':
        return amount;
      case 'annual':
      case 'annually':
        return amount / 12;
      default:
        return amount;
    }
  };

  // Calculate payroll for a specific month considering raises AND future hires
  const calculateMonthlyPayroll = (monthDate: Date) => {
    const monthEnd = endOfMonth(monthDate);
    
    // Include employees who have started by this month
    const activeEmployeesInMonth = employees.filter(e => {
      if (!e.start_date) return true; // No start date = already employed
      return parseISO(e.start_date) <= monthEnd;
    });

    return activeEmployeesInMonth.reduce((total, employee) => {
      // Find if there's an approved raise effective in or before this month
      const applicableRaise = raises
        .filter(r => r.employee_id === employee.id && r.status === 'approved')
        .filter(r => {
          const raiseDate = parseISO(r.effective_date);
          return raiseDate <= monthEnd;
        })
        .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())[0];

      const salary = applicableRaise 
        ? normalizeToMonthly(applicableRaise.new_salary, 'annually') // Raises are stored as annual amounts
        : normalizeToMonthly(employee.salary_amount, employee.salary_type);

      return total + salary;
    }, 0);
  };

  // Get raises happening in a specific month
  const getRaisesInMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    return raises.filter(r => {
      const raiseDate = parseISO(r.effective_date);
      return isWithinInterval(raiseDate, { start: monthStart, end: monthEnd });
    });
  };

  // Get new hires starting in a specific month
  const getHiresInMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    return futureHires.filter(e => {
      const startDate = parseISO(e.start_date);
      return isWithinInterval(startDate, { start: monthStart, end: monthEnd });
    });
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const months = [
    addMonths(today, 1),
    addMonths(today, 2),
    addMonths(today, 3),
    addMonths(today, 4)
  ];

  const currentMonthPayroll = calculateMonthlyPayroll(today);
  
  // Only get months that have actual changes (raises OR new hires)
  const upcomingChanges = months
    .map(month => ({
      month,
      payroll: calculateMonthlyPayroll(month),
      raises: getRaisesInMonth(month),
      hires: getHiresInMonth(month),
    }))
    .map((data, index) => {
      const previousPayroll = index === 0 ? currentMonthPayroll : calculateMonthlyPayroll(addMonths(data.month, -1));
      const monthlyChange = data.payroll - previousPayroll;
      const annualChange = monthlyChange * 12;
      return { ...data, monthlyChange, annualChange, previousPayroll };
    })
    .filter(data => data.raises.length > 0 || data.hires.length > 0); // Show months with raises OR new hires

  // If no upcoming changes, don't render anything
  if (upcomingChanges.length === 0) {
    return null;
  }

  // Get the earliest change
  const firstChange = upcomingChanges[0];
  const totalAffectedEmployees = upcomingChanges.reduce((sum, change) => sum + change.raises.length + change.hires.length, 0);
  const isIncrease = firstChange.monthlyChange > 0;
  
  // Calculate new totals after the first change takes effect
  const newMonthlyPayroll = firstChange.payroll;
  const newAnnualPayroll = newMonthlyPayroll * 12;
  
  // Count employees after the first change
  const firstMonthEnd = endOfMonth(firstChange.month);
  const employeesAfterChange = employees.filter(e => {
    if (!e.start_date) return true;
    return parseISO(e.start_date) <= firstMonthEnd;
  }).length;
  const newAverageSalary = employeesAfterChange > 0 ? newAnnualPayroll / employeesAfterChange : 0;

  return (
    <Alert className={`border-l-4 ${isIncrease ? 'border-l-orange-500 bg-orange-50/50' : 'border-l-green-500 bg-green-50/50'}`}>
      <AlertTriangle className={`h-4 w-4 ${isIncrease ? 'text-orange-600' : 'text-green-600'}`} />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              <span className="font-medium">Please note:</span> There is a predicted{' '}
              <span className={`font-semibold ${isIncrease ? 'text-orange-700' : 'text-green-700'}`}>
                {isIncrease ? 'increase' : 'decrease'} of ${Math.abs(firstChange.monthlyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>{' '}
              in your payroll expense starting{' '}
              <span className="font-semibold">{format(firstChange.month, 'MMMM yyyy')}</span>
              {' '}({totalAffectedEmployees} {totalAffectedEmployees === 1 ? 'employee' : 'employees'} affected).
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 h-auto py-1"
          >
            <span className="text-xs mr-1">View details</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* New Totals Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-foreground mb-3">New Payroll Totals (After Changes)</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">New Monthly Payroll</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${newMonthlyPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">New Annual Payroll</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${newAnnualPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">New Avg. Salary</div>
                  <div className="text-lg font-semibold text-foreground">
                    ${newAverageSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="space-y-3">
              {upcomingChanges.map(({ month, payroll, raises: monthRaises, hires: monthHires, monthlyChange, annualChange, previousPayroll }) => {
                const percentChange = previousPayroll > 0 ? (monthlyChange / previousPayroll) * 100 : 0;
                const monthIsIncrease = monthlyChange > 0;

                return (
                  <div key={month.toISOString()} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-normal">
                        {format(month, 'MMM yyyy')}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {monthIsIncrease ? (
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        )}
                        <span className={`text-sm font-semibold ${monthIsIncrease ? 'text-orange-700' : 'text-green-700'}`}>
                          {monthIsIncrease ? '+' : '-'}${Math.abs(monthlyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-xs font-normal ml-1">
                            ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4 space-y-1">
                      {/* Show raises */}
                      {monthRaises.map((raise) => {
                        const employee = employees.find(e => e.id === raise.employee_id);
                        return (
                          <div key={raise.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(parseISO(raise.effective_date), 'MMM d')} - {employee?.first_name} {employee?.last_name} (Raise)
                            </span>
                          </div>
                        );
                      })}
                      {/* Show new hires */}
                      {monthHires.map((hire) => (
                        <div key={hire.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <UserPlus className="h-3 w-3" />
                          <span>
                            {format(parseISO(hire.start_date), 'MMM d')} - {hire.first_name} {hire.last_name} (New Hire)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
