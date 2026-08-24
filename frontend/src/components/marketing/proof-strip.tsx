import { ALL_LEVELS, levelIntervalDays } from "@/lib/domain/level";
import { uz } from "@/lib/i18n/uz";

/**
 * Three numbers under the hero, on one line.
 *
 * Deliberately not cards: the page already has cards in the journey below, and
 * a third grid of boxes is what made the old layout monotonous. A thin strip
 * with dividers separates the hero from the journey without competing.
 *
 * The level count and the longest interval are read from lib/domain/level.ts
 * rather than written out, for the same reason ladder-visual.tsx does it: the
 * marketing page must not be able to claim a schedule the app does not run.
 */

/** The longest interval any level schedules. Mastered has none, so it is skipped. */
function longestIntervalDays(): number {
  return ALL_LEVELS.reduce((longest, level) => {
    const days = levelIntervalDays(level);
    return days !== null && days > longest ? days : longest;
  }, 0);
}

export function ProofStrip() {
  const items = [
    { value: String(ALL_LEVELS.length), label: uz.landing.proofLevels },
    { value: String(longestIntervalDays()), label: uz.landing.proofLongest },
    { value: "0", label: uz.landing.proofManual },
  ];

  return (
    <section className="py-lg" aria-label={uz.landing.proofLabel}>
      <div className="border-border py-lg gap-lg flex flex-wrap items-center justify-center border-y">
        {items.map((item, index) => (
          <div key={item.label} className="gap-lg flex items-center">
            {index > 0 ? (
              <span className="bg-border h-8 w-px flex-none" aria-hidden="true" />
            ) : null}

            <div className="gap-2xs flex flex-col items-center">
              <span className="text-fg text-2xl font-semibold tabular-nums">{item.value}</span>
              <span className="text-fg-subtle text-xs">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
