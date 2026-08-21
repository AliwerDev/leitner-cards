import { ALL_LEVELS, levelIntervalDays } from "@/lib/domain/level";
import { CardLevel } from "@/types/api";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";

/**
 * The review ladder, drawn from the real schedule.
 *
 * Intervals come from lib/domain/level rather than a copy, so the marketing
 * page cannot drift from the algorithm the app actually runs. Pure CSS, no
 * chart library: this stays a server component and needs no hydration.
 *
 * Bar heights are computed, so they arrive as inline style. Every colour is a
 * token class.
 */

/** Shortest and tallest bar, as a percentage of the track. */
const MIN_HEIGHT = 14;
const MAX_HEIGHT = 100;

const LONGEST_INTERVAL = 61;

/**
 * Days map to height on a square root curve. Linear would leave levels 1-4
 * (0 to 7 days) as indistinguishable stubs next to level 7's 61 days.
 */
function barHeight(days: number | null): number {
  if (days === null) return MAX_HEIGHT;
  const ratio = Math.sqrt(days / LONGEST_INTERVAL);
  return MIN_HEIGHT + ratio * (MAX_HEIGHT - MIN_HEIGHT);
}

function intervalLabel(days: number | null): string {
  if (days === null) return "∞";
  if (days === 0) return uz.landing.visualToday;
  return String(days);
}

export function LadderVisual() {
  return (
    <div className="gap-md flex flex-col" aria-hidden="true">
      <div className="gap-2xs flex h-40 items-end justify-between">
        {ALL_LEVELS.map((level) => {
          const days = levelIntervalDays(level);
          const mastered = level === CardLevel.Mastered;

          return (
            <div key={level} className="gap-xs flex flex-1 flex-col items-center">
              <span className="text-2xs text-fg-subtle tabular-nums">{intervalLabel(days)}</span>
              <div
                className={cn("w-full rounded-sm", mastered ? "bg-mastered" : "bg-accent")}
                style={{
                  height: `${barHeight(days)}%`,
                  // The ramp encodes ordinal position, the same way the stats
                  // histogram does. Mastered stands apart at full strength.
                  opacity: mastered ? 1 : 0.35 + (level / 8) * 0.65,
                }}
              />
              <span className="text-2xs text-fg-subtle tabular-nums">{mastered ? "★" : level}</span>
            </div>
          );
        })}
      </div>

      <p className="text-2xs text-fg-subtle text-center">{uz.landing.visualCaption}</p>
    </div>
  );
}
