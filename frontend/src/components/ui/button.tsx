import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";
import type { ButtonVariant } from "@/types/ui";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-fg-on-accent hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface-sunken text-fg hover:bg-surface-hover border border-border",
  ghost: "text-fg-muted hover:bg-surface-hover hover:text-fg",
  danger: "bg-danger text-fg-on-accent hover:bg-danger-hover shadow-sm",
  outline: "border border-border-strong text-fg hover:bg-surface-hover",
};

const SIZES = {
  sm: "h-8 px-sm text-sm gap-2xs rounded-md",
  md: "h-10 px-md text-sm gap-xs rounded-md",
  lg: "h-12 px-lg text-md gap-xs rounded-lg",
  icon: "size-10 rounded-md",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      // A loading button must not be clickable, but `disabled` alone would also
      // remove it from the accessibility tree mid-action, so announce busy too.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap",
        "transition-colors duration-[--duration-fast] ease-out",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {/* Swap the leading icon for the spinner so the button keeps its width. */}
      {loading ? <Spinner size="sm" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
