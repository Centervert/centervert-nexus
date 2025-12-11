import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { EditableCell } from './EditableCell';
import { EditableSelectCell } from './EditableSelectCell';
import { EditableCurrencyCell } from './EditableCurrencyCell';
import { BulkActionBar } from './BulkActionBar';

// Temporary type until DB types are regenerated
type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  payment_account?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
};

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
  onRefetch: () => void;
  searchQuery: string;
}

export function ExpenseTable({ expenses, isLoading, onEdit, onRefetch, searchQuery }: ExpenseTableProps) {
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleDelete = async () => {
    if (!deleteExpense) return;

    try {
      const { error } = await supabase
        .from('expenses' as any)
        .delete()
        .eq('id', deleteExpense.id);

      if (error) throw error;

      onRefetch();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeleteExpense(null);
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.payment_account?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredExpenses.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleStatusToggle = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses' as any)
        .update({ is_active: !expense.is_active })
        .eq('id', expense.id);

      if (error) throw error;
      onRefetch();
    } catch (error) {
      console.error('Error toggling expense status:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading expenses...</div>;
  }

  if (filteredExpenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery ? 'No expenses found matching your search.' : 'No expenses found. Add your first expense to get started.'}
      </div>
    );
  }

  const allSelected = filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < filteredExpenses.length;

  return (
    <>
      {selectedIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          onUpdate={onRefetch}
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) (el as any).indeterminate = someSelected;
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.map((expense) => (
            <TableRow key={expense.id} data-state={selectedIds.includes(expense.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(expense.id)}
                  onCheckedChange={(checked) => handleSelectOne(expense.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">
                <EditableCell
                  value={expense.name}
                  expenseId={expense.id}
                  field="name"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableSelectCell
                  value={expense.category}
                  expenseId={expense.id}
                  field="category"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableCurrencyCell
                  value={expense.amount}
                  expenseId={expense.id}
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableSelectCell
                  value={expense.frequency}
                  expenseId={expense.id}
                  field="frequency"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableSelectCell
                  value={expense.payment_account || ''}
                  expenseId={expense.id}
                  field="payment_account"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleStatusToggle(expense)}
                >
                  {expense.is_active ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Inactive</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(expense)}
                    title="Edit all fields"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteExpense(expense)}
                    title="Delete expense"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteExpense} onOpenChange={() => setDeleteExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteExpense?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
