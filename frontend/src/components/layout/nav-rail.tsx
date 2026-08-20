"use client";

import Link from "next/link";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import { NAV_ICON_STROKE, NAV_ITEMS, useActiveHref } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/**
 * Vertical icon rail, md and up. Replaces the old topbar: a rail costs no
 * vertical space, which the study screen spends on the card instead.
 */
export function NavRail({ dueCount, username }: { dueCount: number; username: string }) {
  const isActive = useActiveHref();

  return (
    <nav
      aria-label={uz.app.name}
      className={cn(
        "gap-xs py-sm sticky top-0 hidden h-dvh w-(--rail-width) flex-none",
        "border-border bg-surface flex-col items-center border-r md:flex",
      )}
    >
      <Tooltip content={uz.app.name}>
        <Link
          href="/decks"
          aria-label={uz.app.name}
          className={cn(
            "bg-accent text-fg-on-accent flex size-8 items-center justify-center",
            "rounded-lg text-xs font-semibold",
          )}
        >
          <span aria-hidden="true">L</span>
        </Link>
      </Tooltip>

      <div className="gap-2xs mt-xs flex flex-col items-center">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const showBadge = item.showDue === true && dueCount > 0;
          const label = showBadge ? `${item.label} (${dueCount})` : item.label;

          return (
            <Tooltip key={item.href} content={label}>
              <Link
                href={item.href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-lg",
                  "transition-colors duration-(--duration-fast) ease-out",
                  active
                    ? "bg-accent-subtle text-accent-text"
                    : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                )}
              >
                {/* Sits outside the icon so the 40px hit area stays square. */}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="bg-accent absolute -left-sm h-5 w-3xs rounded-full"
                  />
                ) : null}

                <Icon size={20} strokeWidth={NAV_ICON_STROKE} aria-hidden="true" />

                {showBadge ? (
                  <span
                    className={cn(
                      "bg-accent text-fg-on-accent border-surface absolute -top-3xs -right-3xs",
                      "px-3xs flex h-4 min-w-4 items-center justify-center rounded-full",
                      "text-2xs leading-none font-semibold tabular-nums",
                      // The ring cuts the badge away from the glyph behind it.
                      "border-2",
                    )}
                  >
                    {dueCount}
                  </span>
                ) : null}
              </Link>
            </Tooltip>
          );
        })}
      </div>

      <div className="flex-1" />

      <ThemeToggle orientation="vertical" />
      <UserMenu username={username} />
    </nav>
  );
}
