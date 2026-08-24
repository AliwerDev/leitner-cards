import { Card } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";

/**
 * A stand-in for the study screen: one card face with its two answers.
 *
 * Drawn rather than screenshotted, so it follows the theme and never goes
 * stale when the real UI changes.
 *
 * The review ladder used to sit under the card face here. It now belongs to
 * the journey stage that explains scheduling, so the page does not draw the
 * same eight bars twice; see LADDER_STAGE_INDEX in journey-section.tsx.
 */
export function HeroVisual() {
  return (
    <Card variant="raised" padding="lg" className="flex flex-col">
      {/* The card face. Decorative, so the sample text is not announced. It
          carries the hero on its own now, so it is given room rather than
          sized to sit above something else. */}
      <div
        className="bg-surface-sunken border-border p-xl gap-md flex flex-col items-center rounded-lg border text-center"
        aria-hidden="true"
      >
        <span className="text-2xs text-fg-subtle tracking-wide uppercase">
          {uz.landing.visualCardLabel}
        </span>
        <p className="text-fg text-3xl">{uz.landing.visualCardFront}</p>
        <div className="gap-xs mt-xs flex">
          <span className="bg-correct text-fg-on-accent px-sm py-2xs rounded-md text-xs font-medium">
            {uz.study.correct}
          </span>
          <span className="bg-wrong text-fg-on-accent px-sm py-2xs rounded-md text-xs font-medium">
            {uz.study.wrong}
          </span>
        </div>
      </div>
    </Card>
  );
}
