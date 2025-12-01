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
import { Trash2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { EditableCell } from './EditableCell';
import { EditableCurrencyCell } from './EditableCurrencyCell';
import { EditableSelectCell } from './EditableSelectCell';

export type Income = {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'projected';
  amount: number;
  frequency: string;
  projected_start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

interface IncomeTableProps {
  income: Income[];
  isLoading: boolean;
  onRefetch: () => void;
  searchQuery: string;
  statusFilter: 'all' | 'verified' | 'projected';
  showDeleted: boolean;
  onSelectIncome: (income: Income) => void;
}

export function IncomeTable({ income, isLoading, onRefetch, searchQuery, statusFilter, showDeleted, onSelectIncome }: IncomeTableProps) {
  const [deleteIncome, setDeleteIncome] = useState<Income | null>(null);

  const handleDelete = async () => {
    if (!deleteIncome) return;

    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('income' as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteIncome.id);

      if (error) throw error;

      onRefetch();
    } catch (error) {
      console.error('Error deleting income:', error);
    } finally {
      setDeleteIncome(null);
    }
  };

  const filteredIncome = income.filter(inc => {
    const matchesSearch = 
      inc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    
    // Filter by deleted status
    const matchesDeleted = showDeleted ? inc.deleted_at !== null : inc.deleted_at === null;
    
    return matchesSearch && matchesStatus && matchesDeleted;
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading income sources...</div>;
  }

  if (filteredIncome.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery || statusFilter !== 'all' 
          ? 'No income sources found matching your filters.' 
          : 'No income sources found. Add your first income source to get started.'}
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredIncome.map((inc) => (
            <TableRow 
              key={inc.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectIncome(inc)}
            >
              <TableCell className="font-medium">
                <EditableCell
                  value={inc.name}
                  incomeId={inc.id}
                  field="name"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableSelectCell
                  value={inc.type}
                  incomeId={inc.id}
                  field="type"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableSelectCell
                  value={inc.status}
                  incomeId={inc.id}
                  field="status"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableCurrencyCell
                  value={inc.amount}
                  incomeId={inc.id}
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>
                <EditableSelectCell
                  value={inc.frequency}
                  incomeId={inc.id}
                  field="frequency"
                  onUpdate={onRefetch}
                />
              </TableCell>
              <TableCell>{formatDate(inc.projected_start_date)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteIncome(inc);
                  }}
                  title="Delete income"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteIncome} onOpenChange={() => setDeleteIncome(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteIncome?.name}"? This action cannot be undone.
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
