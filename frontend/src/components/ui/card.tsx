import { cn } from "@/lib/utils/cn";

const PADDING = {
  none: "",
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
} as const;

const VARIANTS = {
  flat: "bg-surface",
  raised: "bg-surface-raised shadow-md",
  outlined: "bg-surface border border-border",
  interactive:
    "bg-surface border border-border transition-all duration-(--duration-fast) ease-out hover:border-border-strong hover:shadow-md",
} as const;

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: keyof typeof PADDING;
  variant?: keyof typeof VARIANTS;
};

export function Card({
  padding = "md",
  variant = "outlined",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn("rounded-lg", VARIANTS[variant], PADDING[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-3xs", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-sm", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-xs", className)} {...props} />;
}
