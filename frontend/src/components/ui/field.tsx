"use client";

import { cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils/cn";

export type FieldProps = {
  label: string;
  /** First error message for this field, if any. */
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Label + control + error/hint, wired for accessibility.
 *
 * The child control is cloned to receive id, aria-describedby and aria-invalid,
 * so no form in the app has to spell those out - which is how they end up
 * missing or mismatched.
 */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        "aria-describedby": describedBy || undefined,
        invalid: Boolean(error) || undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-2xs", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
        {required ? (
          <span className="ml-3xs text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {control}

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
