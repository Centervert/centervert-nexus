import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface EditableCellProps {
  value: string | null;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  className?: string;
  displayValue?: string;
}

export function EditableCell({ 
  value, 
  onSave, 
  placeholder = "--", 
  type = "text", 
  className = "",
  displayValue,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 min-h-[32px] cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className="text-sm text-muted-foreground flex-1">
        {displayValue || value || placeholder}
      </span>
    </div>
  );
}
