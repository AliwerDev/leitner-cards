"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils/cn";

const SIDES = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2xs",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2xs",
  left: "right-full top-1/2 -translate-y-1/2 mr-2xs",
  right: "left-full top-1/2 -translate-y-1/2 ml-2xs",
} as const;

export type TooltipProps = {
  content: string;
  side?: keyof typeof SIDES;
  className?: string;
  children: React.ReactNode;
};

/**
 * Hover/focus tooltip.
 *
 * Note: a disabled button does not emit pointer events, so wrap the button in
 * this component rather than putting the trigger on the button itself - that is
 * exactly the quota case, where the explanation matters most.
 */
export function Tooltip({ content, side = "top", className, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>

      {visible ? (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "absolute z-[--z-dropdown] w-max max-w-56 rounded-md bg-fg px-xs py-3xs",
            "text-2xs text-fg-inverted shadow-lg",
            SIDES[side],
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
