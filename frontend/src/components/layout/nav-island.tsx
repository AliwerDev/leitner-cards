"use client";

import Link from "next/link";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import { NAV_ICON_STROKE, NAV_ITEMS, useActiveHref } from "./nav-links";
import { ThemeCycle } from "./theme-cycle";
import { UserMenu } from "./user-menu";

/**
 * Floating command island, md and up. Sticky rather than fixed, so it scrolls
 * with the page for one island height and then pins - the content below keeps
 * the full column width instead of paying a permanent side margin to a rail.
 * Below md the dock takes over and this renders nothing.
 *
 * The theme control is a single cycling button here rather than a three-button
 * segmented group: the island is one row of chrome, and the segmented version
 * put five controls in the space of two.
 */
export function NavIsland({ dueCount, username }: { dueCount: number; username: string }) {
  const isActive = useActiveHref();

  return (
    <div className="top-md pointer-events-none sticky z-(--z-sticky) hidden justify-center md:flex">
      <nav
        aria-label={uz.app.name}
        className={cn(
          "gap-2xs p-xs pl-sm border-border pointer-events-auto flex items-center",
          "bg-surface-raised/85 rounded-full border shadow-md backdrop-blur",
        )}
      >
        <Tooltip content={uz.app.name}>
          <Link
            href="/"
            aria-label={uz.app.name}
            className={cn(
              "bg-accent text-fg-on-accent flex size-7 flex-none items-center justify-center",
              "rounded-full text-xs font-semibold",
            )}
          >
            <span aria-hidden="true">M</span>
          </Link>
        </Tooltip>

        <span className="bg-border mx-2xs h-5 w-px flex-none" aria-hidden="true" />

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const showBadge = item.showDue === true && dueCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "gap-xs px-md py-xs flex items-center rounded-full text-sm whitespace-nowrap",
                "transition-colors duration-(--duration-fast) ease-out",
                active
                  ? "bg-surface-sunken text-fg font-medium"
                  : "text-fg-muted hover:bg-surface-hover hover:text-fg",
              )}
            >
              <Icon size={16} strokeWidth={NAV_ICON_STROKE} aria-hidden="true" />
              <span>{item.label}</span>

              {showBadge ? (
                <span
                  className={cn(
                    "bg-accent text-fg-on-accent px-2xs ml-3xs flex h-5 min-w-5 items-center",
                    "text-2xs justify-center rounded-full font-semibold tabular-nums",
                  )}
                >
                  {dueCount}
                </span>
              ) : null}
            </Link>
          );
        })}

        <span className="bg-border mx-2xs h-5 w-px flex-none" aria-hidden="true" />

        <ThemeCycle />
        <UserMenu username={username} />
      </nav>
    </div>
  );
}
