import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { addMonths, format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  salary_amount: number;
  salary_type: string;
}

interface Raise {
  id: string;
  employee_id: string;
  new_salary: number;
  effective_date: string;
  status: string;
}

export const PayrollSummary = () => {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, salary_amount, salary_type')
        .eq('is_active', true);
      
      if (error) throw error;
      console.log('Payroll Summary - Active Employees:', data?.length || 0);
      return data as Employee[];
    },
  });

  const { data: raises = [] } = useQuery({
    queryKey: ['raises-payroll'],
    queryFn: async () => {
      const today = new Date();
      const ninetyDaysOut = addMonths(today, 4); // Extended to 4 months to capture full quarter
      
      console.log('Querying raises from', format(today, 'yyyy-MM-dd'), 'to', format(ninetyDaysOut, 'yyyy-MM-dd'));
      
      const { data, error } = await supabase
        .from('employee_raises')
        .select('*')
        .gte('effective_date', format(today, 'yyyy-MM-dd'))
        .lte('effective_date', format(ninetyDaysOut, 'yyyy-MM-dd'))
        .in('status', ['pending', 'approved']);
      
      if (error) throw error;
      console.log('Payroll Summary - Upcoming Raises:', data?.length || 0, data);
      return data as Raise[];
    },
  });

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

  // Calculate payroll for a specific month considering raises
  const calculateMonthlyPayroll = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    return employees.reduce((total, employee) => {
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

  const [isExpanded, setIsExpanded] = useState(false);

  const today = new Date();
  const months = [
    addMonths(today, 1),
    addMonths(today, 2),
    addMonths(today, 3),
    addMonths(today, 4) // Extended to match query range
  ];

  const currentMonthPayroll = calculateMonthlyPayroll(today);
  
  // Only get months that have actual changes
  const upcomingChanges = months
    .map(month => ({
      month,
      payroll: calculateMonthlyPayroll(month),
      raises: getRaisesInMonth(month),
    }))
    .map((data, index) => {
      const previousPayroll = index === 0 ? currentMonthPayroll : calculateMonthlyPayroll(addMonths(data.month, -1));
      const change = data.payroll - previousPayroll;
      return { ...data, change, previousPayroll };
    })
    .filter(data => data.raises.length > 0); // Only show months with raises

  // If no upcoming changes, don't render anything
  console.log('Payroll Summary - Upcoming Changes:', upcomingChanges.length, upcomingChanges);
  if (upcomingChanges.length === 0) {
    return null;
  }

  // Get the earliest change
  const firstChange = upcomingChanges[0];
  const totalAffectedEmployees = upcomingChanges.reduce((sum, change) => sum + change.raises.length, 0);
  const isIncrease = firstChange.change > 0;

  return (
    <Alert className={`border-l-4 ${isIncrease ? 'border-l-orange-500 bg-orange-50/50' : 'border-l-green-500 bg-green-50/50'}`}>
      <AlertTriangle className={`h-4 w-4 ${isIncrease ? 'text-orange-600' : 'text-green-600'}`} />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              <span className="font-medium">Please note:</span> There is a predicted{' '}
              <span className={`font-semibold ${isIncrease ? 'text-orange-700' : 'text-green-700'}`}>
                {isIncrease ? 'increase' : 'decrease'}
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
          <div className="mt-4 pt-4 border-t space-y-3">
            {upcomingChanges.map(({ month, payroll, raises: monthRaises, change, previousPayroll }) => {
              const percentChange = previousPayroll > 0 ? (change / previousPayroll) * 100 : 0;
              const monthIsIncrease = change > 0;

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
                        {monthIsIncrease ? '+' : '-'}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-normal ml-1">
                          ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-4 space-y-1">
                    {monthRaises.map((raise) => {
                      const employee = employees.find(e => e.id === raise.employee_id);
                      return (
                        <div key={raise.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(parseISO(raise.effective_date), 'MMM d')} - {employee?.first_name} {employee?.last_name}
                            {raise.status === 'pending' && (
                              <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                Pending
                              </Badge>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
