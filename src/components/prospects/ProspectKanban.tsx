import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PROSPECT_STAGES, type ProspectStage } from "@/lib/crm";

export interface KanbanProspect {
  id: string;
  name: string;
  stage: string | null;
  category?: string | null;
  address?: string | null;
  last_activity_at?: string | null;
  activity_count?: number | null;
}

interface Props {
  prospects: KanbanProspect[];
  onStageChange: (prospectId: string, stage: ProspectStage) => void;
}

function ProspectCard({ prospect }: { prospect: KanbanProspect }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: prospect.id });
  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/prospects/${prospect.id}`)}
      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="text-sm font-medium truncate">{prospect.name}</div>
      {prospect.category && (
        <div className="text-xs text-muted-foreground truncate mt-0.5">{prospect.category}</div>
      )}
      {prospect.address && (
        <div className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {prospect.address}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{prospect.activity_count ?? 0} activities</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {prospect.last_activity_at
            ? formatDistanceToNow(new Date(prospect.last_activity_at), { addSuffix: true })
            : "never worked"}
        </span>
      </div>
    </Card>
  );
}

function StageColumn({
  stage,
  label,
  hint,
  prospects,
}: {
  stage: ProspectStage;
  label: string;
  hint: string;
  prospects: KanbanProspect[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `pstage:${stage}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border bg-muted/30 min-w-[240px] max-w-[280px] flex-1 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="p-3 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{prospects.length}</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
      </div>
      <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[100px]">
        {prospects.map((p) => (
          <ProspectCard key={p.id} prospect={p} />
        ))}
      </div>
    </div>
  );
}

export function ProspectKanban({ prospects, onStageChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStage = useMemo(() => {
    const m: Record<string, KanbanProspect[]> = {};
    for (const s of PROSPECT_STAGES) m[s.value] = [];
    for (const p of prospects) {
      const s = p.stage || "target";
      (m[s] ?? m["target"]).push(p);
    }
    return m;
  }, [prospects]);

  const onDragEnd = (e: DragEndEvent) => {
    const overId = e.over?.id?.toString() ?? "";
    if (!overId.startsWith("pstage:")) return;
    const stage = overId.slice("pstage:".length) as ProspectStage;
    const id = e.active.id.toString();
    const prospect = prospects.find((p) => p.id === id);
    if (!prospect || prospect.stage === stage) return;
    onStageChange(id, stage);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PROSPECT_STAGES.map((s) => (
          <StageColumn
            key={s.value}
            stage={s.value}
            label={s.label}
            hint={s.hint}
            prospects={byStage[s.value] || []}
          />
        ))}
      </div>
    </DndContext>
  );
}
