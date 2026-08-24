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

/**
 * `md` is the in-page call to action. `sm` is for the header, where a 12-unit
 * control stands taller than the theme toggle beside it.
 */
const SIZES = {
  md: "px-lg text-md h-12 rounded-lg",
  sm: "px-md text-sm h-9 rounded-md",
} as const;

export type CtaLinkProps = {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
};

export function CtaLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: CtaLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "gap-xs inline-flex items-center justify-center",
        "font-medium whitespace-nowrap",
        "transition-colors duration-(--duration-fast) ease-out",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
