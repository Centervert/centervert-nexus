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
import { Plus, Trash2, DollarSign } from 'lucide-react';

type Expense = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
};

type AssociatedExpense = {
  id: string;
  income_id: string;
  expense_id: string | null;
  projected_expense_name: string | null;
  projected_expense_amount: number | null;
  projected_expense_frequency: string | null;
  is_projected: boolean;
  notes: string | null;
  expense?: Expense;
};

interface IncomeAssociatedCostsProps {
  incomeId: string;
}

export function IncomeAssociatedCosts({ incomeId }: IncomeAssociatedCostsProps) {
  const [associatedExpenses, setAssociatedExpenses] = useState<AssociatedExpense[]>([]);
  const [availableExpenses, setAvailableExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'existing' | 'projected'>('existing');
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [projectedName, setProjectedName] = useState('');
  const [projectedAmount, setProjectedAmount] = useState('');
  const [projectedFrequency, setProjectedFrequency] = useState('Monthly');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch associated expenses
      const { data: associated, error: associatedError } = await supabase
        .from('income_associated_expenses' as any)
        .select('*')
        .eq('income_id', incomeId);

      if (associatedError) throw associatedError;

      // Fetch all expenses for selection and to join with associated
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses' as any)
        .select('id, name, amount, frequency, category')
        .eq('is_active', true);

      if (expensesError) throw expensesError;

      const expensesList = (expenses || []) as unknown as Expense[];

      // Get already linked expense IDs
      const linkedExpenseIds = (associated || [])
        .filter((a: any) => a.expense_id)
        .map((a: any) => a.expense_id);

      // Filter available expenses (not already linked)
      setAvailableExpenses(
        expensesList.filter((e) => !linkedExpenseIds.includes(e.id))
      );

      // Enrich associated expenses with expense details
      const enrichedAssociated = (associated || []).map((a: any) => {
        if (a.expense_id) {
          const expense = expensesList.find((e) => e.id === a.expense_id);
          return { ...a, expense };
        }
        return a;
      });

      setAssociatedExpenses(enrichedAssociated);
    } catch (error) {
      console.error('Error fetching associated costs:', error);
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

  const handleAddExistingExpense = async () => {
    if (!selectedExpenseId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('income_associated_expenses' as any)
        .insert({
          income_id: incomeId,
          expense_id: selectedExpenseId,
          is_projected: false,
          created_by: user?.id,
        });

      if (error) throw error;

      setSelectedExpenseId('');
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleAddProjectedExpense = async () => {
    if (!projectedName || !projectedAmount) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('income_associated_expenses' as any)
        .insert({
          income_id: incomeId,
          is_projected: true,
          projected_expense_name: projectedName,
          projected_expense_amount: parseFloat(projectedAmount.replace(/[^0-9.]/g, '')),
          projected_expense_frequency: projectedFrequency,
          created_by: user?.id,
        });

      if (error) throw error;

      setProjectedName('');
      setProjectedAmount('');
      setProjectedFrequency('Monthly');
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error adding projected expense:', error);
    }
  };

  const handleRemoveExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('income_associated_expenses' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error removing expense:', error);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (numericValue) {
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(parseFloat(numericValue));
      setProjectedAmount(formatted);
    } else {
      setProjectedAmount('');
    }
  };

  const totalAssociatedCosts = associatedExpenses.reduce((sum, item) => {
    if (item.is_projected && item.projected_expense_amount) {
      return sum + item.projected_expense_amount;
    } else if (item.expense) {
      return sum + item.expense.amount;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Associated Costs</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Cost
        </Button>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex gap-2">
            <Button
              variant={addType === 'existing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAddType('existing')}
            >
              From Expenses
            </Button>
            <Button
              variant={addType === 'projected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAddType('projected')}
            >
              Projected Cost
            </Button>
          </div>

          {addType === 'existing' ? (
            <div className="space-y-3">
              <Select value={selectedExpenseId} onValueChange={setSelectedExpenseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an expense..." />
                </SelectTrigger>
                <SelectContent>
                  {availableExpenses.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No available expenses
                    </div>
                  ) : (
                    availableExpenses.map((expense) => (
                      <SelectItem key={expense.id} value={expense.id}>
                        {expense.name} - {formatCurrency(expense.amount)}/{expense.frequency}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddExistingExpense} 
                disabled={!selectedExpenseId}
                size="sm"
              >
                Add Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Expense name"
                value={projectedName}
                onChange={(e) => setProjectedName(e.target.value)}
              />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Amount"
                  value={projectedAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={projectedFrequency} onValueChange={setProjectedFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="One-Time">One-Time</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annually">Annually</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddProjectedExpense}
                disabled={!projectedName || !projectedAmount}
                size="sm"
              >
                Add Projected Cost
              </Button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : associatedExpenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No associated costs yet.</p>
      ) : (
        <div className="space-y-2">
          {associatedExpenses.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-background"
            >
              <div>
                <p className="text-sm font-medium">
                  {item.is_projected ? item.projected_expense_name : item.expense?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.is_projected ? (
                    <>
                      {formatCurrency(item.projected_expense_amount || 0)} / {item.projected_expense_frequency}
                      <span className="ml-2 text-orange-600 dark:text-orange-400">Projected</span>
                    </>
                  ) : (
                    <>
                      {formatCurrency(item.expense?.amount || 0)} / {item.expense?.frequency}
                      <span className="ml-2 text-muted-foreground">({item.expense?.category})</span>
                    </>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveExpense(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          
          <div className="flex justify-between pt-2 border-t">
            <span className="text-sm font-medium">Total Associated Costs</span>
            <span className="text-sm font-medium">{formatCurrency(totalAssociatedCosts)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
