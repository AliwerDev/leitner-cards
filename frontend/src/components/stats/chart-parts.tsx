"use client";

import { cn } from "@/lib/utils/cn";

/**
 * Shared chart furniture.
 *
 * Recharts writes SVG attributes, so it cannot read a Tailwind class the way a
 * div does. Every colored mark therefore inherits `currentColor` from a wrapper
 * that DOES wear a token class - that way a theme switch repaints the chart with
 * no JS and no resolved hex values anywhere.
 */

/** Fixed geometry from the design system's mark specs. */
export const CHART = {
  /** Bars never fill their slot; the leftover band is deliberate air. */
  barMaxWidth: 24,
  /** 4px rounded data-end, square at the baseline. */
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  lineWidth: 2,
  dotRadius: 4,
  /** A wash, never a saturated block. */
  areaOpacity: 0.1,
  gridWidth: 1,
} as const;

/** Axis and grid ink. Recessive: one step off the surface, hairline, solid. */
export const AXIS_TICK = {
  fill: "currentColor",
  fontSize: 11,
} as const;

/**
 * Card shell every chart shares, so the title, the plot and the empty state all
 * sit at the same rhythm.
 */
export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "gap-sm border-border bg-surface p-md flex flex-col rounded-lg border",
        className,
      )}
    >
      <div className="gap-md flex items-start justify-between">
        <div className="gap-3xs flex flex-col">
          <h2 className="text-fg text-sm font-medium">{title}</h2>
          {subtitle ? <p className="text-2xs text-fg-subtle">{subtitle}</p> : null}
        </div>
        {action}
      </div>

      {children}
    </section>
  );
}

/**
 * Tooltip body. Recharts renders this inside the SVG's foreignObject-free
 * overlay, so it is a plain div and can wear tokens directly.
 */
export function ChartTooltip({
  label,
  rows,
}: {
  label: string;
  rows: ReadonlyArray<{ key: string; label: string; value: string }>;
}) {
  return (
    <div className="border-border bg-surface-raised shadow-overlay gap-2xs px-sm py-xs flex flex-col rounded-md border">
      <span className="text-2xs text-fg-subtle">{label}</span>
      {rows.map((row) => (
        <span key={row.key} className="gap-sm text-xs flex items-baseline justify-between">
          <span className="text-fg-muted">{row.label}</span>
          <span className="text-fg font-medium tabular-nums">{row.value}</span>
        </span>
      ))}
    </div>
  );
}

/** Shown in place of a plot when the window has no data at all. */
export function ChartEmpty({ message, height }: { message: string; height: number }) {
  return (
    <div
      className="text-2xs text-fg-subtle flex items-center justify-center"
      style={{ height }}
      role="status"
    >
      {message}
    </div>
  );
}
