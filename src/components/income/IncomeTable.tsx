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
import { supabase } from '@/integrations/supabase/client';

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
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

interface IncomeTableProps {
  income: Income[];
  isLoading: boolean;
  onEdit: (income: Income) => void;
  onRefetch: () => void;
  searchQuery: string;
  statusFilter: 'all' | 'verified' | 'projected';
}

export function IncomeTable({ income, isLoading, onEdit, onRefetch, searchQuery, statusFilter }: IncomeTableProps) {
  const [deleteIncome, setDeleteIncome] = useState<Income | null>(null);

  const handleDelete = async () => {
    if (!deleteIncome) return;

    try {
      const { error } = await supabase
        .from('income' as any)
        .delete()
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
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusToggle = async (inc: Income) => {
    try {
      const { error } = await supabase
        .from('income' as any)
        .update({ is_active: !inc.is_active })
        .eq('id', inc.id);

      if (error) throw error;
      onRefetch();
    } catch (error) {
      console.error('Error toggling income status:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

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
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredIncome.map((inc) => (
            <TableRow key={inc.id}>
              <TableCell className="font-medium">{inc.name}</TableCell>
              <TableCell>{inc.type}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    inc.status === 'verified'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}
                >
                  {inc.status === 'verified' ? 'Verified' : 'Projected'}
                </span>
              </TableCell>
              <TableCell>{formatCurrency(inc.amount)}</TableCell>
              <TableCell className="capitalize">{inc.frequency}</TableCell>
              <TableCell>{formatDate(inc.projected_start_date)}</TableCell>
              <TableCell>
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleStatusToggle(inc)}
                >
                  {inc.is_active ? (
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
                    onClick={() => onEdit(inc)}
                    title="Edit income"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteIncome(inc)}
                    title="Delete income"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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
