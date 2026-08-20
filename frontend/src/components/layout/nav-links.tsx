"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";

const LINKS = [
  { href: "/decks", label: uz.nav.decks },
  { href: "/study", label: uz.nav.study, showDue: true },
  { href: "/stats", label: uz.nav.stats },
] as const;

export function NavLinks({ dueCount }: { dueCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-3xs" aria-label={uz.app.name}>
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2xs rounded-md px-sm py-2xs text-sm transition-colors",
              active ? "bg-surface-sunken text-fg" : "text-fg-muted hover:bg-surface-hover",
            )}
          >
            {link.label}
            {"showDue" in link && link.showDue && dueCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-3xs text-2xs font-medium text-fg-on-accent">
                {dueCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
