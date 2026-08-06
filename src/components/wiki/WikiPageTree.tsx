import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WikiTreeNode } from "@/lib/wiki";

interface WikiPageTreeProps {
  nodes: WikiTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  canEdit?: boolean;
  depth?: number;
}

export function WikiPageTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  canEdit,
  depth = 0,
}: WikiPageTreeProps) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <WikiPageTreeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          canEdit={canEdit}
          depth={depth}
        />
      ))}
    </ul>
  );
}

function WikiPageTreeItem({
  node,
  selectedId,
  onSelect,
  onAddChild,
  canEdit,
  depth,
}: {
  node: WikiTreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  canEdit?: boolean;
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-1 py-1 text-sm cursor-pointer transition-colors",
          isSelected ? "bg-muted font-medium" : "hover:bg-muted/50"
        )}
        style={{ paddingLeft: depth * 12 + 4 }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="shrink-0 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate flex-1">{node.title}</span>
        {canEdit && onAddChild && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            title="Add sub-page"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      {hasChildren && open && (
        <WikiPageTree
          nodes={node.children}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          canEdit={canEdit}
          depth={depth + 1}
        />
      )}
    </li>
  );
}
