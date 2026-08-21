import { ArrowRight, LayersIcon, RotateCcw, CalendarClock } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui";
import { CtaLink } from "./cta-link";
import { uz } from "@/lib/i18n/uz";

/**
 * The body sections of the landing page.
 *
 * Each one states a single idea. The wording for the level rule is copied from
 * uz.study.ruleBody on purpose: a visitor who signs up meets the same sentence
 * inside the app, and matching words are what make the claim credible.
 */

const STEP_ICONS = [LayersIcon, RotateCcw, CalendarClock] as const;

/** A heading shared by every section below the hero. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-fg mb-lg text-center text-2xl">{children}</h2>;
}

export function ProblemsSection() {
  return (
    <section className="py-2xl">
      <SectionTitle>{uz.landing.problemsTitle}</SectionTitle>

      <div className="gap-md grid md:grid-cols-3">
        {uz.landing.problems.map((problem) => (
          <Card key={problem.pain} padding="lg" className="gap-sm flex flex-col">
            <p className="text-md text-fg-muted">&ldquo;{problem.pain}&rdquo;</p>
            <p className="text-fg text-sm">{problem.fix}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function StepsSection() {
  return (
    <section className="py-2xl">
      <SectionTitle>{uz.landing.stepsTitle}</SectionTitle>

      <div className="gap-md grid md:grid-cols-3">
        {uz.landing.steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? LayersIcon;

          return (
            <Card key={step.title} padding="lg" className="gap-sm flex flex-col">
              <span
                className="bg-accent-subtle text-accent-text flex size-9 items-center justify-center rounded-md"
                aria-hidden="true"
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.body}</CardDescription>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function RuleSection() {
  return (
    <section className="py-2xl">
      <SectionTitle>{uz.landing.ruleTitle}</SectionTitle>

      <Card padding="lg" className="gap-md mx-auto flex max-w-2xl flex-col">
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
    <section className="py-2xl gap-md flex flex-col items-center text-center">
      <h2 className="text-fg text-2xl">{uz.landing.finalTitle}</h2>
      <p className="text-md text-fg-muted">{uz.landing.finalBody}</p>

      <CtaLink href={signedIn ? "/decks" : "/register"}>
        {signedIn ? uz.landing.ctaSignedIn : uz.landing.ctaPrimary}
      </CtaLink>
    </section>
  );
}
