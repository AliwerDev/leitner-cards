"use client";

import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  /** Show a live "used / max" counter. Pair with maxLength. */
  showCount?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, showCount = false, maxLength, className, onChange, defaultValue, value, ...props },
  ref,
) {
  const countId = useId();
  const initial = String(value ?? defaultValue ?? "").length;
  const [count, setCount] = useState(initial);

  const showCounter = showCount && typeof maxLength === "number";
  // Card front/back cap at 1000 server-side; warn before the request fails.
  const nearLimit = showCounter && count > maxLength * 0.9;

  return (
    <div className="flex flex-col gap-3xs">
      <textarea
        ref={ref}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={invalid || undefined}
        aria-describedby={showCounter ? countId : undefined}
        onChange={(event) => {
          setCount(event.target.value.length);
          onChange?.(event);
        }}
        className={cn(
          "w-full resize-y rounded-md border bg-surface px-sm py-xs text-sm text-fg",
          "placeholder:text-fg-subtle",
          "transition-colors duration-[--duration-fast] ease-out",
          "disabled:cursor-not-allowed disabled:opacity-60",
          invalid ? "border-danger" : "border-border hover:border-border-strong",
          className,
        )}
        {...props}
      />
      {showCounter ? (
        <span
          id={countId}
          aria-live="polite"
          className={cn("self-end text-2xs", nearLimit ? "text-warning-text" : "text-fg-subtle")}
        >
          {count} / {maxLength}
        </span>
      ) : null}
    </div>
  );
});
