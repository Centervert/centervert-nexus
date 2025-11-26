import { useState, useRef, useEffect } from "react";
import { AddressAutocomplete } from "./AddressAutocomplete";

interface EditableAddressCellProps {
  value: string | null;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EditableAddressCell({ 
  value, 
  onSave, 
  placeholder = "--", 
  className = "",
}: EditableAddressCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || "");
    }
  }, [value, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) {
          handleSave();
        }
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, editValue]);

  const handleSave = () => {
    onSave(editValue.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div ref={containerRef} className="w-full" onKeyDown={handleKeyDown}>
        <AddressAutocomplete
          value={editValue}
          onChange={setEditValue}
          placeholder={placeholder}
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
        {value || placeholder}
      </span>
    </div>
  );
}
