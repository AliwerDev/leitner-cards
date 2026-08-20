import { cn } from "@/lib/utils/cn";

export type KbdProps = {
  children: React.ReactNode;
  className?: string;
};

/** A key cap. Used by the study shortcuts legend. */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-border bg-surface-sunken px-3xs",
        "font-mono text-2xs text-fg-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
