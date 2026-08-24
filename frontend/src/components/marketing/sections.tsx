import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { CtaLink } from "./cta-link";
import { uz } from "@/lib/i18n/uz";

/**
 * The closing sections of the landing page.
 *
 * Each one states a single idea. The wording for the level rule is copied from
 * uz.study.ruleBody on purpose: a visitor who signs up meets the same sentence
 * inside the app, and matching words are what make the claim credible.
 *
 * The problem and step grids that used to live here are gone: their content is
 * now the journey, in journey-section.tsx.
 */

/** A heading shared by the sections below the journey. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-fg mb-lg text-center text-2xl">{children}</h2>;
}

export function RuleSection() {
  return (
    <section className="py-3xl">
      <SectionTitle>{uz.landing.ruleTitle}</SectionTitle>

      <Card
        variant="raised"
        padding="lg"
        className="gap-md mx-auto flex max-w-(--measure-2xl) flex-col"
      >
        <div className="gap-sm flex items-center justify-between">
          <span className="text-md text-fg">{uz.landing.ruleCorrect}</span>
          <ArrowRight size={16} className="text-fg-subtle flex-none" aria-hidden="true" />
          <span className="text-md text-correct font-medium">{uz.landing.ruleCorrectResult}</span>
        </div>

        <div className="bg-border h-px w-full" aria-hidden="true" />

        <div className="gap-sm flex items-center justify-between">
          <span className="text-md text-fg">{uz.landing.ruleWrong}</span>
          <ArrowRight size={16} className="text-fg-subtle flex-none" aria-hidden="true" />
          <span className="text-md text-wrong font-medium">{uz.landing.ruleWrongResult}</span>
        </div>

        <p className="text-fg-muted text-sm">{uz.landing.ruleFooter}</p>
      </Card>
    </section>
  );
}

export function FinalCtaSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="py-3xl gap-md flex flex-col items-center text-center">
      <h2 className="text-fg text-3xl">{uz.landing.finalTitle}</h2>
      <p className="text-md text-fg-muted">{uz.landing.finalBody}</p>

      <CtaLink href={signedIn ? "/decks" : "/register"}>
        {signedIn ? uz.landing.ctaSignedIn : uz.landing.ctaPrimary}
      </CtaLink>
    </section>
  );
}
