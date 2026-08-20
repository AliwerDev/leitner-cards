import { CardLevel } from "@/types/api";
import { cn } from "@/lib/utils/cn";
import { levelIntervalDays } from "@/lib/domain/level";
import { uz } from "@/lib/i18n/uz";
import type { LevelBucket } from "@/types/api";

/**
 * The level ladder: one box per level, with the number of cards above it.
 *
 * The histogram on the stats page compares levels against each other, so it
 * uses bar heights. This board answers a different question: which levels does
 * the deck have, and how full is each one. A box per level reads better for
 * that, and it stays legible when every count is zero.
 *
 * A level that holds cards takes the accent. An empty one stays muted, so the
 * filled levels are the ones the eye lands on. The accent follows the deck
 * colour, because the parent re-points --color-accent for this subtree.
 */

function intervalHint(level: CardLevel): string {
  const days = levelIntervalDays(level);
  if (days === null) return "";
  if (days === 0) return uz.stats.intervalToday;
  return uz.stats.intervalDays(days);
}

export function LevelBoard({ buckets }: { buckets: LevelBucket[] }) {
  return (
    <ol className="gap-2xs flex items-end justify-between" aria-label={uz.stats.byLevel}>
      {/* All eight buckets always render, zeros included - a gap would read as
          missing data rather than an empty level. */}
      {buckets.map((bucket) => {
        const mastered = bucket.level === CardLevel.Mastered;
        const filled = bucket.count > 0;
        const hint = intervalHint(bucket.level);
        const label = mastered ? uz.stats.masteredShort : uz.stats.levelShort(bucket.level);

        return (
          <li key={bucket.level} className="gap-2xs flex flex-1 flex-col items-center">
            <span
              className={cn(
                "text-xs tabular-nums",
                filled ? "text-fg" : "text-fg-subtle",
              )}
            >
              {bucket.count}
            </span>

            <div
              className={cn(
                "flex aspect-square w-full max-w-12 items-center justify-center rounded-lg text-sm font-medium",
                filled ? "bg-accent text-fg-on-accent" : "bg-surface-sunken text-fg-muted",
              )}
              title={`${label}${hint ? ` - ${hint}` : ""}`}
            >
              <span aria-hidden="true">{mastered ? "★" : bucket.level}</span>
              <span className="sr-only">
                {label}: {uz.stats.cardsInLevel(bucket.count)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
