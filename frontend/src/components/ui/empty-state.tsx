import { cn } from "@/lib/utils/cn";

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * The empty view for every list in the app.
 *
 * Centralised so no page hand-rolls one - which is how empty states end up
 * inconsistent or, more often, missing entirely.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-sm rounded-lg border border-dashed border-border px-lg py-2xl text-center",
        className,
      )}
    >
      {icon ? (
        <span className="text-2xl text-fg-subtle" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-3xs">
        <p className="font-medium text-fg">{title}</p>
        {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
