import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface EditableCellProps {
  value: string;
  expenseId: string;
  field: string;
  onUpdate: () => void;
}

export function EditableCell({ value, expenseId, field, onUpdate }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('expenses' as any)
        .update({ [field]: editValue || null })
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        autoFocus
        className="h-8"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded min-h-[2rem] flex items-center transition-colors"
    >
      {value || <span className="text-muted-foreground italic">Click to add</span>}
    </div>
  );
}
