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
  incomeId: string;
  field: 'type' | 'status' | 'frequency';
  onUpdate: () => void;
}

const typeOptions = ['Project', 'Retainer', 'Recurring Service', 'One-Time', 'Other'];

const statusOptions = [
  { value: 'verified', label: 'Verified' },
  { value: 'projected', label: 'Projected' },
];

const frequencyOptions = ['One-Time', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];

export function EditableSelectCell({ value, incomeId, field, onUpdate }: EditableSelectCellProps) {
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
        .from('income' as any)
        .update({ [field]: newValue })
        .eq('id', incomeId);

      if (error) throw error;
      
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating income:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getOptions = () => {
    switch (field) {
      case 'type':
        return typeOptions.map(opt => ({ value: opt, label: opt }));
      case 'status':
        return statusOptions;
      case 'frequency':
        return frequencyOptions.map(opt => ({ value: opt.toLowerCase(), label: opt }));
      default:
        return [];
    }
  };

  const formatDisplay = (val: string) => {
    if (field === 'frequency') {
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
    if (field === 'status') {
      return val === 'verified' ? 'Verified' : 'Projected';
    }
    return val;
  };

  const getStatusColor = () => {
    if (field === 'status') {
      return value === 'verified' 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-orange-600 dark:text-orange-400';
    }
    return '';
  };

  if (isEditing) {
    return (
      <Select
        defaultValue={value}
        onValueChange={(val) => handleSave(val)}
        disabled={isSaving}
        open={true}
        onOpenChange={(open) => !open && setIsEditing(false)}
      >
        <SelectTrigger className="h-8 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getOptions().map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {field === 'status' && (
                <span className={option.value === 'verified' ? 'text-green-600' : 'text-orange-600'}>
                  {option.label}
                </span>
              )}
              {field !== 'status' && option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[2rem] flex items-center transition-colors ${getStatusColor()}`}
    >
      {formatDisplay(value)}
    </div>
  );
}
