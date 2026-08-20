"use client";

import Link from "next/link";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import { NAV_ICON_STROKE, NAV_ITEMS, useActiveHref } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/**
 * Floating command island, md and up. Sticky rather than fixed, so it scrolls
 * with the page for one island height and then pins - the content below keeps
 * the full column width instead of paying a permanent side margin to a rail.
 * Below md the dock takes over and this renders nothing.
 */
export function NavIsland({ dueCount, username }: { dueCount: number; username: string }) {
  const isActive = useActiveHref();

  return (
    <div className="top-md z-(--z-sticky) pointer-events-none sticky hidden justify-center md:flex">
      <nav
        aria-label={uz.app.name}
        className={cn(
          "gap-3xs p-2xs border-border pointer-events-auto flex items-center rounded-full border",
          "bg-surface/80 shadow-md backdrop-blur",
        )}
      >
        <Tooltip content={uz.app.name}>
          <Link
            href="/decks"
            aria-label={uz.app.name}
            className={cn(
              "bg-accent text-fg-on-accent ml-3xs flex size-7 items-center justify-center",
              "rounded-full text-xs font-semibold",
            )}
          >
            <span aria-hidden="true">L</span>
          </Link>
        </Tooltip>

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
                "gap-2xs px-sm py-2xs flex items-center rounded-full text-sm",
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
                    "bg-accent text-fg-on-accent px-3xs flex h-4 min-w-4 items-center",
                    "text-2xs justify-center rounded-full leading-none font-semibold tabular-nums",
                  )}
                >
                  {dueCount}
                </span>
              ) : null}
            </Link>
          );
        })}

        <span className="bg-border mx-3xs h-5 w-px" aria-hidden="true" />

        <ThemeToggle />
        <UserMenu username={username} />
      </nav>
    </div>
  );
}
