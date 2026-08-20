"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type DropdownItem = {
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
};

export type DropdownProps = {
  trigger: React.ReactNode;
  items: readonly DropdownItem[];
  align?: "start" | "end";
  ariaLabel: string;
};

/** Trigger + menu for row actions. */
export function Dropdown({ trigger, items, align = "end", ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex"
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-[--z-dropdown] mt-2xs flex min-w-40 flex-col rounded-md border border-border bg-surface-raised p-3xs shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "rounded-sm px-xs py-2xs text-left text-sm transition-colors",
                "disabled:pointer-events-none disabled:opacity-50",
                item.tone === "danger"
                  ? "text-danger-text hover:bg-danger-subtle"
                  : "text-fg hover:bg-surface-hover",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
