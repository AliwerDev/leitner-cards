"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";

// Explicit measure tokens, not max-w-sm/md/lg: the theme defines --spacing-md
// and friends, and Tailwind resolves max-w-* against the spacing namespace
// first, so the t-shirt names would collapse the dialog to a ~1rem column.
const SIZES = {
  sm: "max-w-(--measure-sm)",
  md: "max-w-(--measure-md)",
  lg: "max-w-(--measure-lg)",
} as const;

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: keyof typeof SIZES;
  /** Accessible name. Rendered by DialogTitle inside children. */
  ariaLabel?: string;
  children: React.ReactNode;
};

/**
 * Modal built on native <dialog>.
 *
 * showModal() gives focus trapping, inertness of the background and Escape
 * handling for free - all of which a div-based modal has to reimplement and
 * usually gets wrong.
 */
export function Dialog({ open, onOpenChange, size = "md", ariaLabel, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Escape fires `cancel`; keep React state as the single source of truth.
  const handleCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      onOpenChange(false);
    },
    [onOpenChange],
  );

  // Clicks land on <dialog> itself only when they hit the backdrop, because the
  // inner panel covers the rest of its box.
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === ref.current) onOpenChange(false);
    },
    [onOpenChange],
  );

  return (
    <dialog
      ref={ref}
      aria-label={ariaLabel}
      onCancel={handleCancel}
      onClick={handleClick}
      onClose={() => onOpenChange(false)}
      className={cn(
        // m-auto restores centering: Tailwind preflight zeroes the UA margin
        // that centers a modal <dialog>, which pins it to the top-left corner.
        "m-auto w-[calc(100%-2rem)] rounded-lg border border-border bg-surface p-0 text-fg shadow-overlay",
        "max-h-[calc(100dvh-2rem)] overflow-y-auto",
        "backdrop:bg-canvas/60 backdrop:backdrop-blur-sm",
        SIZES[size],
      )}
    >
      {/* Mount children only while open so form state resets between openings. */}
      {open ? <div className="flex flex-col gap-md p-lg">{children}</div> : null}
    </dialog>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-3xs", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-md", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-xs", className)} {...props} />;
}

export const dialogLabels = { close: uz.common.close } as const;
