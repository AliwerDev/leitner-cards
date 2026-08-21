import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * A call to action that navigates.
 *
 * Button in components/ui is a real <button>; wrapping a Link in one nests an
 * anchor inside a button, which breaks middle-click, "open in new tab" and the
 * accessibility tree. This mirrors the Button primary/secondary styles onto an
 * anchor instead. The two files must stay visually in step.
 */

const VARIANTS = {
  primary: "bg-accent text-fg-on-accent hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface-sunken text-fg hover:bg-surface-hover border border-border",
} as const;

export type CtaLinkProps = {
  href: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
  children: React.ReactNode;
};

export function CtaLink({ href, variant = "primary", className, children }: CtaLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "px-lg text-md gap-xs inline-flex h-12 items-center justify-center rounded-lg",
        "font-medium whitespace-nowrap",
        "transition-colors duration-(--duration-fast) ease-out",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
