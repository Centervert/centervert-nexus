import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import { addMonths, format, isSameMonth, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

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
      return data as Employee[];
    },
  });

  const { data: raises = [] } = useQuery({
    queryKey: ['raises-payroll'],
    queryFn: async () => {
      const today = new Date();
      const threeMonthsOut = addMonths(today, 3);
      
      const { data, error } = await supabase
        .from('employee_raises')
        .select('*')
        .gte('effective_date', format(today, 'yyyy-MM-dd'))
        .lte('effective_date', format(threeMonthsOut, 'yyyy-MM-dd'))
        .in('status', ['pending', 'approved']);
      
      if (error) throw error;
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

  const today = new Date();
  const months = [
    addMonths(today, 1),
    addMonths(today, 2),
    addMonths(today, 3)
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
  if (upcomingChanges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {upcomingChanges.map(({ month, payroll, raises: monthRaises, change, previousPayroll }) => {
        const percentChange = previousPayroll > 0 ? (change / previousPayroll) * 100 : 0;
        const isIncrease = change > 0;

        return (
          <Alert key={month.toISOString()} className={`border-2 ${isIncrease ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50'}`}>
            <AlertTriangle className={`h-5 w-5 ${isIncrease ? 'text-orange-600' : 'text-green-600'}`} />
            <AlertTitle className="flex items-center gap-2 text-base">
              <span className="font-semibold">
                {isIncrease ? 'Payroll Increase Detected' : 'Payroll Decrease Detected'}
              </span>
              <Badge variant="outline" className={`${isIncrease ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                {format(month, 'MMMM yyyy')}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <div className="flex items-center gap-3">
                {isIncrease ? (
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                )}
                <span className={`text-lg font-semibold ${isIncrease ? 'text-orange-900' : 'text-green-900'}`}>
                  {isIncrease ? '+' : '-'}${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                  <span className="text-base font-normal ml-1">
                    ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  New monthly payroll: ${payroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="text-sm space-y-1 mt-3">
                <p className="font-medium text-foreground">Affected employees:</p>
                {monthRaises.map((raise) => {
                  const employee = employees.find(e => e.id === raise.employee_id);
                  return (
                    <div key={raise.id} className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(parseISO(raise.effective_date), 'MMM d')} - {employee?.first_name} {employee?.last_name}
                        {raise.status === 'pending' && <span className="text-yellow-600 font-medium"> (pending approval)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};
