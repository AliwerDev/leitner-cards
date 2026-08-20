import { CardLevel } from "@/types/api";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";
import type { LevelBucket } from "@/types/api";

/**
 * Levels are ordinal, not categorical, so the bars use one accent with a
 * lightness ramp rather than the deck palette. Mastered stands apart.
 */
export function LevelHistogram({ buckets }: { buckets: LevelBucket[] }) {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <div className="flex flex-col gap-sm rounded-lg border border-border bg-surface p-md">
      <h2 className="text-sm font-medium text-fg">{uz.stats.byLevel}</h2>

      <div className="flex items-end gap-2xs" style={{ height: "10rem" }}>
        {/* All eight buckets always render, zeros included - a gap would read
            as missing data rather than an empty level. */}
        {buckets.map((bucket) => {
          const mastered = bucket.level === CardLevel.Mastered;
          const heightPercent = (bucket.count / max) * 100;

          return (
            <div key={bucket.level} className="flex flex-1 flex-col items-center gap-2xs">
              <span className="text-2xs tabular-nums text-fg-muted">{bucket.count}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn("w-full rounded-t-sm", mastered ? "bg-mastered" : "bg-accent")}
                  style={{
                    height: `${Math.max(heightPercent, bucket.count > 0 ? 4 : 1)}%`,
                    opacity: mastered ? 1 : 0.35 + (bucket.level / 8) * 0.65,
                  }}
                />
              </div>
              <span className="text-2xs text-fg-subtle">{mastered ? "★" : bucket.level}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
