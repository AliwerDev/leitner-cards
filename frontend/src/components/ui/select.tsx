import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export type SelectOption = { value: string | number; label: string; disabled?: boolean };

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  options: readonly SelectOption[];
  invalid?: boolean;
  placeholder?: string;
};

/**
 * Styled native <select>.
 *
 * Eight levels and two directions do not justify a custom listbox: the native
 * control is already accessible, keyboard-navigable and correct on mobile.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, invalid = false, placeholder, className, ...props },
  ref,
) {
  return (
    <div className="relative flex items-center">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full appearance-none rounded-md border bg-surface px-sm pr-9 text-sm text-fg",
          "transition-colors duration-[--duration-fast] ease-out",
          "disabled:cursor-not-allowed disabled:opacity-60",
          invalid ? "border-danger" : "border-border hover:border-border-strong",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-sm text-xs text-fg-subtle"
        aria-hidden="true"
      >
        ▾
      </span>
    </div>
  );
});
