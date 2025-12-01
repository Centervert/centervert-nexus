import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface EditableCurrencyCellProps {
  value: number;
  expenseId: string;
  onUpdate: () => void;
}

export function EditableCurrencyCell({ value, expenseId, onUpdate }: EditableCurrencyCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleEdit = () => {
    setEditValue(value.toString());
    setIsEditing(true);
  };

  const handleSave = async () => {
    const numValue = parseFloat(editValue.replace(/[^0-9.]/g, '')) || 0;
    
    if (numValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('expenses' as any)
        .update({ amount: numValue })
        .eq('id', expenseId);

      if (error) throw error;
      
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating expense amount:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setEditValue(value);
  };

  if (isEditing) {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <Input
          value={editValue}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          autoFocus
          className="h-8 pl-7"
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleEdit}
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[2rem] flex items-center transition-colors"
    >
      {formatCurrency(value)}
    </div>
  );
}
