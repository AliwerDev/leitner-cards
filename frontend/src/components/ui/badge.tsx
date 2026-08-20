import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

const TONES: Record<Tone, { surface: string; text: string; dot: string }> = {
  neutral: { surface: "bg-surface-sunken", text: "text-fg-muted", dot: "bg-fg-subtle" },
  accent: { surface: "bg-accent-subtle", text: "text-accent-text", dot: "bg-accent" },
  success: { surface: "bg-success-subtle", text: "text-success-text", dot: "bg-success" },
  danger: { surface: "bg-danger-subtle", text: "text-danger-text", dot: "bg-danger" },
  warning: { surface: "bg-warning-subtle", text: "text-warning-text", dot: "bg-warning" },
  info: { surface: "bg-info-subtle", text: "text-info-text", dot: "bg-info" },
};

const SIZES = {
  sm: "h-5 px-2xs text-2xs gap-3xs",
  md: "h-6 px-xs text-xs gap-2xs",
} as const;

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  size?: keyof typeof SIZES;
  dot?: boolean;
};

export function Badge({
  tone = "neutral",
  size = "md",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const styles = TONES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        styles.surface,
        styles.text,
        SIZES[size],
        className,
      )}
      {...props}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
