import { Card } from "@/components/ui";
import { LadderVisual } from "./ladder-visual";
import { uz } from "@/lib/i18n/uz";

/**
 * A stand-in for the study screen: one card face above the review ladder.
 *
 * Drawn rather than screenshotted, so it follows the theme and never goes
 * stale when the real UI changes.
 */
export function HeroVisual() {
  return (
    <Card variant="raised" padding="lg" className="gap-lg flex flex-col">
      {/* The card face. Decorative, so the sample text is not announced. */}
      <div
        className="bg-surface-sunken border-border p-lg gap-sm flex flex-col rounded-lg border"
        aria-hidden="true"
      >
        <span className="text-2xs text-fg-subtle tracking-wide uppercase">
          {uz.landing.visualCardLabel}
        </span>
        <p className="text-fg text-xl">{uz.landing.visualCardFront}</p>
        <div className="gap-xs mt-xs flex">
          <span className="bg-correct text-fg-on-accent px-sm py-2xs rounded-md text-xs font-medium">
            {uz.study.correct}
          </span>
          <span className="bg-wrong text-fg-on-accent px-sm py-2xs rounded-md text-xs font-medium">
            {uz.study.wrong}
          </span>
        </div>
      </div>

      <LadderVisual />
    </Card>
  );
}
