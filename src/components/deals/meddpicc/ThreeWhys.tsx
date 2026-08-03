import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  whyChange: string | null;
  whyNow: string | null;
  whyUs: string | null;
  onSave: (patch: Record<string, string | null>) => void;
}

const FIELDS = [
  { key: "why_change", label: "Why Change?", prop: "whyChange" as const, hint: "Why act at all?" },
  { key: "why_now", label: "Why Now?", prop: "whyNow" as const, hint: "Why this period?" },
  { key: "why_us", label: "Why Us?", prop: "whyUs" as const, hint: "Why Centervert?" },
];

export function ThreeWhys(props: Props) {
  const [draft, setDraft] = useState({
    why_change: props.whyChange ?? "",
    why_now: props.whyNow ?? "",
    why_us: props.whyUs ?? "",
  });

  useEffect(() => {
    setDraft({
      why_change: props.whyChange ?? "",
      why_now: props.whyNow ?? "",
      why_us: props.whyUs ?? "",
    });
  }, [props.whyChange, props.whyNow, props.whyUs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <p className="text-xs font-semibold mb-1">
            {f.label} <span className="font-normal text-muted-foreground">{f.hint}</span>
          </p>
          <Textarea
            rows={2}
            className="text-sm"
            value={(draft as any)[f.key]}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            onBlur={() => {
              const value = (draft as any)[f.key];
              if (value !== (props[f.prop] ?? "")) props.onSave({ [f.key]: value || null });
            }}
          />
        </div>
      ))}
    </div>
  );
}