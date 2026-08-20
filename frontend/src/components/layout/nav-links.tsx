"use client";

import { usePathname } from "next/navigation";
import { ChartPie, CirclePlay, Layers, type LucideIcon } from "lucide-react";
import { uz } from "@/lib/i18n/uz";

/** Icon geometry is deliberately curve-led - circles and arcs rather than bars
 *  and squares - so a 56px rail of glyphs does not read as spiky. */
export const NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
  showDue?: true;
}> = [
  { href: "/decks", label: uz.nav.decks, icon: Layers },
  { href: "/study", label: uz.nav.study, icon: CirclePlay, showDue: true },
  { href: "/stats", label: uz.nav.stats, icon: ChartPie },
];

/** Stroke weight for every nav glyph. Lucide ships 2, which reads hard at rail
 *  size; 1.75 keeps the line soft without going faint on a dark canvas. */
export const NAV_ICON_STROKE = 1.75;

/** Shared active test. A nested route keeps its section lit, so /decks/4 still
 *  highlights Decks. */
export function useActiveHref(): (href: string) => boolean {
  const pathname = usePathname();
  return (href) => pathname === href || pathname.startsWith(`${href}/`);
}
