import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Users, DollarSign, TrendingUp, Search, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedLayout from '@/components/UnifiedLayout';
import { EmployeeDialog } from '@/components/hr/EmployeeDialog';
import { EmployeeTable } from '@/components/hr/EmployeeTable';
import { PayrollSummary } from '@/components/hr/PayrollSummary';
import { Database } from '@/integrations/supabase/types';
import { isFuture, parseISO, format } from 'date-fns';

type Employee = Database['public']['Tables']['employees']['Row'];

const HumanResources = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [countryFilter, setCountryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees', countryFilter],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (countryFilter !== 'all') {
        query = query.eq('country', countryFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Fetch all raises to include approved raises that have taken effect
  const { data: raises = [] } = useQuery({
    queryKey: ['all-raises'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('employee_raises')
        .select('*')
        .eq('status', 'approved')
        .lte('effective_date', today);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate payroll totals
  const calculateAnnualSalary = (employee: Employee) => {
    // Check if there's an approved raise that has already taken effect
    const applicableRaise = raises
      .filter(r => r.employee_id === employee.id)
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())[0];
    
    // Use the new salary from the raise if it exists, otherwise use base salary
    const salaryAmount = applicableRaise ? Number(applicableRaise.new_salary) : Number(employee.salary_amount);
    const salaryType = applicableRaise ? 'annual' : employee.salary_type; // Raises are stored as annual amounts
    
    switch (salaryType) {
      case 'weekly':
        return salaryAmount * 52;
      case 'monthly':
        return salaryAmount * 12;
      case 'annual':
        return salaryAmount;
      default:
        return 0;
    }
  };

  // Separate current employees from future hires
  const today = new Date();
  const currentEmployees = employees.filter(e => 
    e.is_active && (!e.start_date || !isFuture(parseISO(e.start_date)))
  );
  const futureHires = employees.filter(e => 
    e.is_active && e.start_date && isFuture(parseISO(e.start_date))
  );

  const activeEmployees = currentEmployees;
  const totalAnnualPayroll = activeEmployees.reduce((sum, emp) => sum + calculateAnnualSalary(emp), 0);
  const totalMonthlyPayroll = totalAnnualPayroll / 12;
  const usEmployees = activeEmployees.filter(e => e.country === 'United States').length;
  const internationalEmployees = activeEmployees.filter(e => e.country !== 'United States').length;

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEmployee(undefined);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseDialog();
  };

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Human Resources</h1>
            <p className="text-muted-foreground">Manage your team and payroll</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="United States">🇺🇸 United States</SelectItem>
                <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Payroll Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees.length}</div>
              <p className="text-xs text-muted-foreground">
                {usEmployees} US • {internationalEmployees} International
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalMonthlyPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Total monthly cost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Payroll</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalAnnualPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Total annual cost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${activeEmployees.length > 0 
                  ? (totalAnnualPayroll / activeEmployees.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Per employee (annual)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 90-Day Payroll Forecast */}
        <PayrollSummary />

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EmployeeTable
              employees={currentEmployees}
              isLoading={isLoading}
              onEdit={handleEdit}
              onRefetch={refetch}
              searchQuery={searchQuery}
            />
          </CardContent>
        </Card>

        {/* Upcoming Hires Section */}
        {futureHires.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base text-amber-900">Upcoming Hires</CardTitle>
                <span className="text-sm text-amber-700">({futureHires.length})</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {futureHires.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => handleEdit(employee)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200 hover:border-amber-300 transition-colors text-left"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {employee.first_name} {employee.last_name}
                      </span>
                      {employee.nickname && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({employee.nickname})
                        </span>
                      )}
                      <span className="text-muted-foreground mx-2">•</span>
                      <span className="text-sm text-muted-foreground">{employee.position}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {employee.country === 'Philippines' && '🇵🇭'}
                        {employee.country === 'United States' && '🇺🇸'}
                      </span>
                      <span className="text-amber-700 font-medium">
                        Starts {format(parseISO(employee.start_date!), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        employee={selectedEmployee}
        onSuccess={handleSuccess}
      />
    </UnifiedLayout>
  );
};

export default HumanResources;
