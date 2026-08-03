import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  displayElement,
  elementsForProfile,
  scoreLabel,
  scoreMap,
  scoreTone,
  type ElementRow,
} from "@/lib/meddpicc";

interface Props {
  elements: ElementRow[];
  profile: string | null | undefined;
  onSelect?: (key: string) => void;
}

export function HeatMap({ elements, profile, onSelect }: Props) {
  const defs = elementsForProfile(profile);
  const scores = scoreMap(elements);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap gap-1.5">
        {defs.map((def) => {
          const d = displayElement(def, profile);
          const score = scores[def.key] ?? 0;
          return (
            <Tooltip key={def.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onSelect?.(def.key)}
                  className={`h-8 min-w-8 px-2 rounded-md text-xs font-semibold transition-opacity hover:opacity-80 ${scoreTone(score)}`}
                >
                  {profile === "lite" ? d.label : def.letter}
                  <span className="ml-1 font-normal opacity-80">{score}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{d.label}</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">{d.question}</p>
                <p className="text-xs mt-1">
                  {score}/4 — {scoreLabel(score)}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}