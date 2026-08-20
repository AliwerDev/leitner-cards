import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: "h-8 text-sm",
  md: "h-10 text-sm",
} as const;

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: keyof typeof SIZES;
  invalid?: boolean;
  leadingIcon?: React.ReactNode;
  trailingSlot?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", invalid = false, leadingIcon, trailingSlot, className, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-md border bg-surface px-sm text-fg",
        "placeholder:text-fg-subtle",
        "transition-colors duration-[--duration-fast] ease-out",
        "disabled:cursor-not-allowed disabled:opacity-60",
        invalid ? "border-danger" : "border-border hover:border-border-strong",
        SIZES[size],
        leadingIcon && "pl-9",
        trailingSlot && "pr-9",
        className,
      )}
      {...props}
    />
  );

  if (!leadingIcon && !trailingSlot) return input;

  return (
    <div className="relative flex items-center">
      {leadingIcon ? (
        <span
          className="pointer-events-none absolute left-sm flex text-fg-subtle"
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      ) : null}
      {input}
      {trailingSlot ? <span className="absolute right-sm flex">{trailingSlot}</span> : null}
    </div>
  );
});
