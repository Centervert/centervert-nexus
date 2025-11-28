import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
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
    today,
    addMonths(today, 1),
    addMonths(today, 2)
  ];

  const currentMonthPayroll = calculateMonthlyPayroll(today);
  const monthlyData = months.map(month => ({
    month,
    payroll: calculateMonthlyPayroll(month),
    raises: getRaisesInMonth(month),
  }));

  return (
    <div className="space-y-6">
      {/* Current Month Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Monthly Payroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${currentMonthPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {employees.length} active {employees.length === 1 ? 'employee' : 'employees'}
          </p>
        </CardContent>
      </Card>

      {/* 90-Day Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            90-Day Payroll Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map(({ month, payroll, raises: monthRaises }, index) => {
              const isCurrentMonth = isSameMonth(month, today);
              const previousPayroll = index > 0 ? monthlyData[index - 1].payroll : currentMonthPayroll;
              const change = payroll - previousPayroll;
              const percentChange = previousPayroll > 0 ? (change / previousPayroll) * 100 : 0;
              const hasChanges = monthRaises.length > 0;

              return (
                <div key={index} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">
                        {format(month, 'MMMM yyyy')}
                      </h4>
                      {isCurrentMonth && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                      {hasChanges && (
                        <Badge variant="secondary" className="text-xs">
                          {monthRaises.length} {monthRaises.length === 1 ? 'raise' : 'raises'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">
                        ${payroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      
                      {!isCurrentMonth && change !== 0 && (
                        <div className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {change > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            ${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {monthRaises.length > 0 && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        {monthRaises.map((raise) => {
                          const employee = employees.find(e => e.id === raise.employee_id);
                          return (
                            <div key={raise.id} className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(parseISO(raise.effective_date), 'MMM d')} - {employee?.first_name} {employee?.last_name}
                                {raise.status === 'pending' && <span className="text-yellow-600"> (pending approval)</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
