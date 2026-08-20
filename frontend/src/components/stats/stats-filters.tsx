"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";

export const DAY_RANGES = [7, 30, 90] as const;
export type DayRange = (typeof DAY_RANGES)[number];
export const DEFAULT_DAYS: DayRange = 30;

const RANGE_LABELS: Record<DayRange, string> = {
  7: uz.stats.range7d,
  30: uz.stats.range30d,
  90: uz.stats.range90d,
};

/**
 * Deck and time-range filters in one row above the charts.
 *
 * Both write to the query string, and each preserves the other - changing the
 * deck used to reset the range because it rebuilt the URL from scratch.
 */
export function StatsFilters({
  decks,
  deckId,
  days,
}: {
  decks: Deck[];
  deckId?: number;
  days: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const push = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    const query = next.toString();
    router.push(query ? `/stats?${query}` : "/stats");
  };

  return (
    <div className="gap-xs flex flex-wrap items-center">
      <div className="w-56">
        <Select
          aria-label={uz.deck.one}
          value={deckId ?? ""}
          onChange={(event) => push("deckId", event.target.value)}
          options={[
            { value: "", label: uz.stats.allDecks },
            ...decks.map((deck) => ({ value: deck.id, label: deck.name })),
          ]}
        />
      </div>

      <div className="w-32">
        <Select
          aria-label={uz.stats.rangeLabel}
          value={days}
          onChange={(event) => push("days", event.target.value)}
          options={DAY_RANGES.map((range) => ({
            value: range,
            label: RANGE_LABELS[range],
          }))}
        />
      </div>
    </div>
  );
}
