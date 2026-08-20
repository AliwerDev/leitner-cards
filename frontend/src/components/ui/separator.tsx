import { cn } from "@/lib/utils/cn";

export type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  /** Optional centered caption, rendered only for horizontal separators. */
  label?: string;
  className?: string;
};

export function Separator({ orientation = "horizontal", label, className }: SeparatorProps) {
  if (orientation === "vertical") {
    return <div role="separator" aria-orientation="vertical" className={cn("w-px self-stretch bg-border", className)} />;
  }

  if (!label) {
    return <div role="separator" className={cn("h-px w-full bg-border", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-sm", className)}>
      <div className="h-px flex-1 bg-border" />
      <span className="text-2xs tracking-wide text-fg-subtle uppercase">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
