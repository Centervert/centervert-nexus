import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TemperatureSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function TemperatureSlider({ 
  value, 
  onChange, 
  disabled = false,
  showLabel = true,
  size = "md"
}: TemperatureSliderProps) {
  const getTemperatureInfo = (temp: number) => {
    if (temp <= 3) {
      return { label: "Cold", color: "bg-blue-500", textColor: "text-blue-600" };
    } else if (temp <= 6) {
      return { label: "Warm", color: "bg-yellow-500", textColor: "text-yellow-600" };
    } else {
      return { label: "Hot", color: "bg-red-500", textColor: "text-red-600" };
    }
  };

  const tempInfo = getTemperatureInfo(value);

  return (
    <div className={cn("space-y-2", size === "sm" && "space-y-1")}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn(
            "font-medium",
            tempInfo.textColor,
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {tempInfo.label}
          </span>
          <span className={cn(
            "font-semibold",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {value}/10
          </span>
        </div>
      )}
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={10}
        step={1}
        disabled={disabled}
        className={cn(
          "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4",
          size === "sm" && "[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
        )}
      />
      {!showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span className={cn("font-medium", tempInfo.textColor)}>{value}</span>
          <span>10</span>
        </div>
      )}
    </div>
  );
}

export function TemperatureDisplay({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const getTemperatureInfo = (temp: number) => {
    if (temp <= 3) {
      return { label: "Cold", bgColor: "bg-blue-100", textColor: "text-blue-700", barColor: "bg-blue-500" };
    } else if (temp <= 6) {
      return { label: "Warm", bgColor: "bg-yellow-100", textColor: "text-yellow-700", barColor: "bg-yellow-500" };
    } else {
      return { label: "Hot", bgColor: "bg-red-100", textColor: "text-red-700", barColor: "bg-red-500" };
    }
  };

  const tempInfo = getTemperatureInfo(value);
  const percentage = (value / 10) * 100;

  return (
    <div className={cn("flex items-center gap-2", size === "sm" && "gap-1.5")}>
      <div className={cn(
        "relative h-2 rounded-full bg-muted overflow-hidden",
        size === "sm" ? "w-16" : "w-24"
      )}>
        <div 
          className={cn("absolute inset-y-0 left-0 rounded-full", tempInfo.barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        "font-medium px-1.5 py-0.5 rounded",
        tempInfo.bgColor,
        tempInfo.textColor,
        size === "sm" ? "text-xs" : "text-xs"
      )}>
        {value}
      </span>
    </div>
  );
}
