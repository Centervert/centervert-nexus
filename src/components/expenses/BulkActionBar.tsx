import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
  onUpdate: () => void;
}

const categoryOptions = [
  'Technology',
  'Marketing',
  'Phone/Communications',
  'Office',
  'Software',
  'Insurance',
  'Other',
];

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

export function BulkActionBar({ selectedCount, selectedIds, onClear, onUpdate }: BulkActionBarProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleBulkUpdate = async (field: string, value: string | boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('expenses' as any)
        .update({ [field]: value })
        .in('id', selectedIds);

      if (error) throw error;
      onUpdate();
      onClear();
    } catch (error) {
      console.error('Error bulk updating expenses:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('expenses' as any)
        .delete()
        .in('id', selectedIds);

      if (error) throw error;
      onUpdate();
      onClear();
    } catch (error) {
      console.error('Error bulk deleting expenses:', error);
    } finally {
      setIsUpdating(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 p-3 bg-muted/50 border rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Set Category:</span>
          <Select onValueChange={(value) => handleBulkUpdate('category', value)} disabled={isUpdating}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Set Frequency:</span>
          <Select onValueChange={(value) => handleBulkUpdate('frequency', value)} disabled={isUpdating}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {frequencyOptions.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Set Status:</span>
          <Select onValueChange={(value) => handleBulkUpdate('is_active', value === 'active')} disabled={isUpdating}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-4 w-px bg-border" />

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDeleteDialog(true)} 
          disabled={isUpdating}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Expense{selectedCount > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} expense{selectedCount > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
