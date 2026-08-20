import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

const TONES: Record<Tone, string> = {
  neutral: "bg-fg-subtle",
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
};

const SIZES = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
} as const;

export type ProgressProps = {
  value: number;
  max?: number;
  tone?: Tone;
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
};

export function Progress({
  value,
  max = 100,
  tone = "accent",
  size = "md",
  label,
  className,
}: ProgressProps) {
  // Guard against max = 0 (an empty deck) and out-of-range values.
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-surface-sunken", SIZES[size], className)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-[--duration-normal] ease-out", TONES[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
