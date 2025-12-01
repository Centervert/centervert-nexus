import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, DollarSign, TrendingDown, TrendingUp, Calendar, Search, CheckCircle, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnifiedLayout from '@/components/UnifiedLayout';
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { IncomeDialog } from '@/components/income/IncomeDialog';
import { IncomeTable, type Income } from '@/components/income/IncomeTable';

// Temporary type until DB types are regenerated
type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  vendor?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
};

const ExpenseTracking = () => {
  // Expense state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  // Income state
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | undefined>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'projected'>('all');
  const [incomeSearchQuery, setIncomeSearchQuery] = useState('');

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('expenses' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }
      return (data as any || []) as Expense[];
    },
  });

  // Fetch income
  const { data: incomeList = [], isLoading: incomeLoading, refetch: refetchIncome } = useQuery({
    queryKey: ['income'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching income:', error);
        return [];
      }
      return (data as any || []) as Income[];
    },
  });

  // Calculate expense totals
  const calculateAnnualExpense = (expense: Expense) => {
    const amount = Number(expense.amount);
    const frequency = expense.frequency?.toLowerCase();
    
    switch (frequency) {
      case 'weekly':
        return amount * 52;
      case 'monthly':
        return amount * 12;
      case 'quarterly':
        return amount * 4;
      case 'annually':
        return amount;
      default:
        return 0;
    }
  };

  // Calculate income totals
  const calculateMonthlyIncome = (inc: Income) => {
    const amount = Number(inc.amount);
    const frequency = inc.frequency?.toLowerCase();
    
    switch (frequency) {
      case 'weekly':
        return amount * 4.33;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'annually':
        return amount / 12;
      case 'one-time':
        return 0; // One-time doesn't count toward monthly
      default:
        return 0;
    }
  };

  // Expense calculations
  const activeExpenses = expenses.filter(e => e.is_active);
  const totalAnnualExpenses = activeExpenses.reduce((sum, exp) => sum + calculateAnnualExpense(exp), 0);
  const totalMonthlyExpenses = totalAnnualExpenses / 12;

  const categoryTotals = activeExpenses.reduce((acc, exp) => {
    const category = exp.category;
    const annual = calculateAnnualExpense(exp);
    acc[category] = (acc[category] || 0) + annual;
    return acc;
  }, {} as Record<string, number>);

  // Income calculations
  const activeIncome = incomeList.filter(i => i.is_active);
  const verifiedIncome = activeIncome.filter(i => i.status === 'verified');
  const projectedIncome = activeIncome.filter(i => i.status === 'projected');
  
  const verifiedMonthlyTotal = verifiedIncome.reduce((sum, inc) => sum + calculateMonthlyIncome(inc), 0);
  const projectedMonthlyTotal = projectedIncome.reduce((sum, inc) => sum + calculateMonthlyIncome(inc), 0);
  const totalMonthlyIncome = verifiedMonthlyTotal + projectedMonthlyTotal;

  // Expense handlers
  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseDialogOpen(true);
  };

  const handleCloseExpenseDialog = () => {
    setExpenseDialogOpen(false);
    setSelectedExpense(undefined);
  };

  const handleExpenseSuccess = () => {
    refetchExpenses();
    handleCloseExpenseDialog();
  };

  // Income handlers
  const handleEditIncome = (income: Income) => {
    setSelectedIncome(income);
    setIncomeDialogOpen(true);
  };

  const handleCloseIncomeDialog = () => {
    setIncomeDialogOpen(false);
    setSelectedIncome(undefined);
  };

  const handleIncomeSuccess = () => {
    refetchIncome();
    handleCloseIncomeDialog();
  };

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance Tracking</h1>
          <p className="text-muted-foreground">Manage business income and expenses</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {/* Expense Controls */}
            <div className="flex justify-between items-center">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Professional Services">Professional Services</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setExpenseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>

            {/* Expense Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Expenses</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeExpenses.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Recurring subscriptions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalMonthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total monthly cost
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Annual Expenses</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalAnnualExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total annual cost
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(categoryTotals).length > 0
                      ? Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0][0]
                      : 'N/A'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Highest spending category
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Expense Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recurring Expenses</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search expenses..."
                      value={expenseSearchQuery}
                      onChange={(e) => setExpenseSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ExpenseTable
                  expenses={expenses}
                  isLoading={expensesLoading}
                  onEdit={handleEditExpense}
                  onRefetch={refetchExpenses}
                  searchQuery={expenseSearchQuery}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-6">
            {/* Income Controls */}
            <div className="flex justify-between items-center">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Income</SelectItem>
                  <SelectItem value="verified">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Verified Only
                    </span>
                  </SelectItem>
                  <SelectItem value="projected">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Projected Only
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIncomeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </div>

            {/* Income Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeIncome.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Income sources
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Verified Monthly</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ${verifiedMonthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Confirmed income
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Projected Monthly</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    ${projectedMonthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expected income
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Monthly</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined monthly income
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Income Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Income Sources</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search income..."
                      value={incomeSearchQuery}
                      onChange={(e) => setIncomeSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <IncomeTable
                  income={incomeList}
                  isLoading={incomeLoading}
                  onEdit={handleEditIncome}
                  onRefetch={refetchIncome}
                  searchQuery={incomeSearchQuery}
                  statusFilter={statusFilter}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={handleCloseExpenseDialog}
        expense={selectedExpense}
        onSuccess={handleExpenseSuccess}
      />

      <IncomeDialog
        open={incomeDialogOpen}
        onOpenChange={handleCloseIncomeDialog}
        income={selectedIncome}
        onSuccess={handleIncomeSuccess}
      />
    </UnifiedLayout>
  );
};

export default ExpenseTracking;
