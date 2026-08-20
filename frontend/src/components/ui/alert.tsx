import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-sunken border-border text-fg",
  accent: "bg-accent-subtle border-accent text-accent-text",
  success: "bg-success-subtle border-success text-success-text",
  danger: "bg-danger-subtle border-danger text-danger-text",
  warning: "bg-warning-subtle border-warning text-warning-text",
  info: "bg-info-subtle border-info text-info-text",
};

export type AlertProps = {
  tone?: Tone;
  title?: string;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

export function Alert({
  tone = "neutral",
  title,
  icon,
  onDismiss,
  dismissLabel = "Yopish",
  className,
  children,
}: AlertProps) {
  return (
    <div
      // Errors must interrupt; everything else waits for a pause.
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-xs rounded-md border-l-2 px-sm py-xs text-sm",
        TONES[tone],
        className,
      )}
    >
      {icon ? (
        <span className="mt-3xs shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3xs">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-xs opacity-90">{children}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="shrink-0 rounded-xs px-3xs opacity-60 transition-opacity hover:opacity-100"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
