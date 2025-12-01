import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface EditableSelectCellProps {
  value: string;
  expenseId: string;
  field: 'category' | 'frequency';
  onUpdate: () => void;
}

const categoryOptions = [
  'Software',
  'Infrastructure',
  'Marketing',
  'Office',
  'Insurance',
  'Professional Services',
  'Other',
];

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

export function EditableSelectCell({ value, expenseId, field, onUpdate }: EditableSelectCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('expenses' as any)
        .update({ [field]: newValue })
        .eq('id', expenseId);

      if (error) throw error;
      
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDisplay = (val: string) => {
    if (field === 'frequency') {
      return frequencyOptions.find(opt => opt.value === val)?.label || val;
    }
    return val;
  };

  if (isEditing) {
    return (
      <Select
        value={value}
        onValueChange={handleSave}
        disabled={isSaving}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field === 'category' && categoryOptions.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
          {field === 'frequency' && frequencyOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[2rem] flex items-center transition-colors"
    >
      {formatDisplay(value)}
    </div>
  );
}
