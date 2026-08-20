"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import { NAV_ICON_STROKE, NAV_ITEMS, useActiveHref } from "./nav-links";

/**
 * Floating pill dock, below md. The three Uzbek labels are too long to sit side
 * by side on a 360px phone, so only the current item carries its text and the
 * rest stay icon-only - which also marks position without a second indicator.
 */
export function NavDock({ dueCount }: { dueCount: number }) {
  const isActive = useActiveHref();

  return (
    <nav
      aria-label={uz.app.name}
      className={cn(
        "fixed bottom-lg left-1/2 z-(--z-sticky) -translate-x-1/2 md:hidden",
        "gap-3xs p-2xs border-border flex rounded-full border",
        "bg-surface/80 shadow-overlay backdrop-blur",
        // Keeps the dock clear of the iOS home indicator.
        "mb-[env(safe-area-inset-bottom)]",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        const showBadge = item.showDue === true && dueCount > 0;
        const label = showBadge ? `${item.label} (${dueCount})` : item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "gap-2xs px-sm relative flex min-h-11 items-center justify-center rounded-full",
              "text-sm font-medium transition-colors duration-(--duration-fast) ease-out",
              active ? "bg-accent text-fg-on-accent" : "text-fg-muted hover:bg-surface-hover",
            )}
          >
            <Icon size={20} strokeWidth={NAV_ICON_STROKE} aria-hidden="true" />

            {active ? <span>{item.label}</span> : null}

            {showBadge && !active ? (
              <span
                aria-hidden="true"
                className={cn(
                  "bg-accent text-fg-on-accent border-surface absolute top-3xs right-2xs",
                  "px-3xs flex h-4 min-w-4 items-center justify-center rounded-full",
                  "text-2xs border-2 leading-none font-semibold tabular-nums",
                )}
              >
                {dueCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
