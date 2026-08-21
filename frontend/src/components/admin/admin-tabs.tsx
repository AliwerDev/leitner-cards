"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";

const TABS = [
  { href: "/admin", label: uz.admin.dashboard },
  { href: "/admin/users", label: uz.admin.users },
] as const;

/**
 * Switches between the two admin screens.
 *
 * Not in NAV_ITEMS: the primary nav is consumed by both the island and the dock,
 * and neither should grow an entry most accounts must never see.
 */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-3xs" aria-label={uz.admin.title}>
      {TABS.map((tab) => {
        // /admin must not light up for /admin/users, so the dashboard tab
        // matches exactly while the users tab also covers its detail pages.
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-sm py-2xs text-sm transition-colors",
              active ? "bg-accent text-fg-on-accent" : "text-fg-muted hover:bg-surface-hover",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
