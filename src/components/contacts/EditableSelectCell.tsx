import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditableSelectCellProps {
  value: string | null;
  onSave: (value: string | null) => void;
  options: Array<{ id: string; name: string }>;
  placeholder?: string;
  renderValue?: (option: { id: string; name: string } | null) => React.ReactNode;
  onValueClick?: (id: string) => void;
}

export function EditableSelectCell({
  value,
  onSave,
  options,
  placeholder = "--",
  renderValue,
  onValueClick,
}: EditableSelectCellProps) {
  const [isEditing, setIsEditing] = useState(false);

  const selectedOption = options.find((opt) => opt.id === value);

  const handleSave = (newValue: string) => {
    if (newValue === "none") {
      onSave(null);
    } else {
      onSave(newValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Select
        value={value || "none"}
        onValueChange={handleSave}
        open={isEditing}
        onOpenChange={(open) => !open && setIsEditing(false)}
      >
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No company</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div
      className="flex items-center gap-2 min-h-[32px] cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex-1">
        {selectedOption ? (
          renderValue ? (
            renderValue(selectedOption)
          ) : (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                if (onValueClick && value) {
                  onValueClick(value);
                }
              }}
            >
              {selectedOption.name}
            </Badge>
          )
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>
    </div>
  );
}
