import { useMemo } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { TemperatureDisplay } from "./TemperatureSlider";
import { Card } from "@/components/ui/card";
import { DollarSign, AlertTriangle } from "lucide-react";
import { DEAL_STAGES, type DealStage, maxScore, scorePercent } from "@/lib/meddpicc";

export { DEAL_STAGES };
export type { DealStage };

interface KanbanDeal {
  id: string;
  name: string;
  stage: string;
  temperature: number;
  expected_value: number | null;
  qualification_score?: number | null;
  critical_gap_count?: number | null;
  methodology_profile?: string | null;
  organizations?: { name: string } | null;
  owner?: { full_name: string | null; email: string } | null;
}

interface Props {
  deals: KanbanDeal[];
  onStageChange: (dealId: string, newStage: DealStage) => void;
}

function DealCard({ deal }: { deal: KanbanDeal }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/deals/${deal.id}`)}
      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="text-sm font-medium truncate">{deal.name}</div>
      {deal.organizations?.name && (
        <div className="text-xs text-muted-foreground truncate mt-0.5">{deal.organizations.name}</div>
      )}
      <div className="flex items-center justify-between mt-2">
        <TemperatureDisplay value={deal.temperature} size="sm" />
        {deal.expected_value && (
          <span className="text-xs flex items-center text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            {deal.expected_value.toLocaleString()}
          </span>
        )}
      </div>
      {(deal.owner?.full_name || deal.owner?.email) && (
        <div className="text-[10px] text-muted-foreground mt-1 truncate">
          {deal.owner?.full_name || deal.owner?.email}
        </div>
      )}
      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
        <span className="text-muted-foreground">
          {scorePercent(deal.qualification_score ?? 0, deal.methodology_profile)}%
          {" · "}
          {deal.qualification_score ?? 0}/{maxScore(deal.methodology_profile)}
        </span>
        {!!deal.critical_gap_count && deal.critical_gap_count > 0 && (
          <span className="flex items-center gap-0.5 text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {deal.critical_gap_count}
          </span>
        )}
      </div>
    </Card>
  );
}

function StageColumn({ stage, label, deals }: { stage: DealStage; label: string; deals: KanbanDeal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage}` });
  const total = deals.reduce((s, d) => s + (d.expected_value || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border bg-muted/30 min-w-[240px] max-w-[280px] flex-1 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="p-3 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        {total > 0 && (
          <div className="text-xs text-muted-foreground mt-0.5">${total.toLocaleString()}</div>
        )}
      </div>
      <div className="p-2 space-y-2 flex-1 overflow-y-auto min-h-[100px]">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  );
}

export function DealKanban({ deals, onStageChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStage = useMemo(() => {
    const m: Record<string, KanbanDeal[]> = {};
    for (const s of DEAL_STAGES) m[s.value] = [];
    for (const d of deals) {
      const s = (d.stage as string) || "discovery";
      if (m[s]) m[s].push(d);
      else m["discovery"].push(d);
    }
    return m;
  }, [deals]);

  const onDragEnd = (e: DragEndEvent) => {
    const overId = e.over?.id?.toString() ?? "";
    if (!overId.startsWith("stage:")) return;
    const newStage = overId.slice("stage:".length) as DealStage;
    const dealId = e.active.id.toString();
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;
    onStageChange(dealId, newStage);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STAGES.map((s) => (
          <StageColumn key={s.value} stage={s.value} label={s.label} deals={byStage[s.value] || []} />
        ))}
      </div>
    </DndContext>
  );
}