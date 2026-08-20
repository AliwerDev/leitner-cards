import type { Metadata } from "next";
import { Stat } from "@/components/ui";
import { StatsStrip } from "@/components/stats/stats-strip";
import { LevelHistogram } from "@/components/stats/level-histogram";
import { DeckFilter } from "@/components/stats/deck-filter";
import { getStats } from "@/lib/api/endpoints/stats";
import { listDecks } from "@/lib/api/endpoints/decks";
import { formatAccuracy } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.stats.title };

type PageProps = { searchParams: Promise<{ deckId?: string }> };

export default async function StatsPage({ searchParams }: PageProps) {
  const { deckId: deckIdRaw } = await searchParams;
  const deckId = deckIdRaw ? Number(deckIdRaw) : undefined;
  const validDeckId = deckId && Number.isInteger(deckId) && deckId > 0 ? deckId : undefined;

  const [stats, decks] = await Promise.all([getStats(validDeckId), listDecks()]);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-2xl">{uz.stats.title}</h1>
        <div className="w-56">
          <DeckFilter decks={decks} selected={validDeckId} />
        </div>
      </div>

      <StatsStrip stats={stats} />

      <div className="grid gap-md lg:grid-cols-[2fr_1fr]">
        <LevelHistogram buckets={stats.by_level} />

        <div className="flex flex-col gap-md">
          {/* The window is a rolling 24 hours, not a calendar day. */}
          <Stat label={uz.stats.reviewsToday} value={stats.reviews_today} />
          {/* accuracy_7d is a 0..1 ratio, and null when there were no reviews. */}
          <Stat
            label={uz.stats.accuracy7d}
            value={formatAccuracy(stats.accuracy_7d)}
            tone={stats.accuracy_7d === null ? "neutral" : "accent"}
          />
        </div>
      </div>
    </div>
  );
}
