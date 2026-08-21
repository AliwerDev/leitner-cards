import type { Metadata } from "next";
import { Stat } from "@/components/ui";
import { StatsStrip } from "@/components/stats/stats-strip";
import { LevelHistogram } from "@/components/stats/level-histogram";
import { ReviewsTrend } from "@/components/stats/reviews-trend";
import { AccuracyTrend } from "@/components/stats/accuracy-trend";
import { StatsFilters } from "@/components/stats/stats-filters";
import { PageHeader } from "@/components/layout/page-header";
import { getDailyStats, getStats } from "@/lib/api/endpoints/stats";
import { listDecks } from "@/lib/api/endpoints/decks";
import { formatAccuracy } from "@/lib/domain/format";
import { parseDayRange } from "@/lib/domain/stats-range";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.stats.title };

type PageProps = { searchParams: Promise<{ deckId?: string; days?: string }> };

export default async function StatsPage({ searchParams }: PageProps) {
  const { deckId: deckIdRaw, days: daysRaw } = await searchParams;
  const deckId = deckIdRaw ? Number(deckIdRaw) : undefined;
  const validDeckId = deckId && Number.isInteger(deckId) && deckId > 0 ? deckId : undefined;
  const days = parseDayRange(daysRaw);

  const [stats, decks, daily] = await Promise.all([
    getStats(validDeckId),
    listDecks(),
    getDailyStats(days, validDeckId),
  ]);

  return (
    <div className="gap-lg flex flex-col">
      <PageHeader
        title={uz.stats.title}
        action={<StatsFilters decks={decks} deckId={validDeckId} days={days} />}
      />

      <StatsStrip stats={stats} />

      <ReviewsTrend days={daily.days} />

      <div className="gap-md grid lg:grid-cols-[2fr_1fr]">
        <LevelHistogram buckets={stats.by_level} />

        <div className="gap-md flex flex-col">
          <AccuracyTrend days={daily.days} />
          <Stat label={uz.stats.reviewsToday} value={stats.reviews_today} />
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
