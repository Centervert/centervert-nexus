import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, DollarSign, TrendingDown, Calendar, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedLayout from '@/components/UnifiedLayout';
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: expenses = [], isLoading, refetch } = useQuery({
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
      
      if (error) throw error;
      return (data as any || []) as Expense[];
    },
  });

  // Calculate expense totals
  const calculateAnnualExpense = (expense: Expense) => {
    const amount = Number(expense.amount);
    
    switch (expense.frequency) {
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

  const activeExpenses = expenses.filter(e => e.is_active);
  const totalAnnualExpenses = activeExpenses.reduce((sum, exp) => sum + calculateAnnualExpense(exp), 0);
  const totalMonthlyExpenses = totalAnnualExpenses / 12;

  const categoryTotals = activeExpenses.reduce((acc, exp) => {
    const category = exp.category;
    const annual = calculateAnnualExpense(exp);
    acc[category] = (acc[category] || 0) + annual;
    return acc;
  }, {} as Record<string, number>);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedExpense(undefined);
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
            <h1 className="text-3xl font-bold text-foreground">Expense Tracking</h1>
            <p className="text-muted-foreground">Manage recurring business expenses</p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ExpenseTable
              expenses={expenses}
              isLoading={isLoading}
              onEdit={handleEdit}
              onRefetch={refetch}
              searchQuery={searchQuery}
            />
          </CardContent>
        </Card>
      </div>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        expense={selectedExpense}
        onSuccess={handleSuccess}
      />
    </UnifiedLayout>
  );
};

export default ExpenseTracking;
