"use client";

import { cn } from "@/lib/utils/cn";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-6 w-10 shrink-0 items-center rounded-full p-3xs",
        "transition-colors duration-[--duration-fast] ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent" : "bg-surface-active",
        className,
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full bg-surface shadow-sm",
          "transition-transform duration-[--duration-fast] ease-out",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}
