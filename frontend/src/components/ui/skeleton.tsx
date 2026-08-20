import { cn } from "@/lib/utils/cn";

const VARIANTS = {
  text: "h-4 rounded-sm",
  circle: "rounded-full",
  rect: "rounded-md",
} as const;

export type SkeletonProps = {
  variant?: keyof typeof VARIANTS;
  /** For variant="text": render this many lines, the last one shortened. */
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function Skeleton({ variant = "rect", lines = 1, className, style }: SkeletonProps) {
  const base = cn("animate-pulse bg-surface-sunken", VARIANTS[variant], className);

  if (variant === "text" && lines > 1) {
    return (
      <div className="flex flex-col gap-2xs" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(base, index === lines - 1 && "w-3/5")}
            style={index === lines - 1 ? undefined : style}
          />
        ))}
      </div>
    );
  }

  return <div className={base} style={style} aria-hidden="true" />;
}
