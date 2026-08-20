import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

const TONES: Record<Tone, string> = {
  neutral: "text-fg",
  accent: "text-accent-text",
  success: "text-success-text",
  danger: "text-danger-text",
  warning: "text-warning-text",
  info: "text-info-text",
};

export type StatProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
};

export function Stat({ label, value, hint, tone = "neutral", icon, className }: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2xs rounded-lg border border-border bg-surface p-md",
        className,
      )}
    >
      <div className="flex items-center gap-2xs text-xs text-fg-muted">
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <p className={cn("text-2xl font-semibold tabular-nums", TONES[tone])}>{value}</p>
      {hint ? <p className="text-2xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
