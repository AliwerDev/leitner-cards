import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { CtaLink } from "@/components/marketing/cta-link";
import { HeroVisual } from "@/components/marketing/hero-visual";
import {
  FinalCtaSection,
  ProblemsSection,
  RuleSection,
  StepsSection,
} from "@/components/marketing/sections";
import { uz } from "@/lib/i18n/uz";

/**
 * The public landing page.
 *
 * Reading the session costs one /auth/me call, which is what lets a signed-in
 * visitor see "go to the app" instead of "sign up". Middleware lets this path
 * through in both states; see LANDING_PATH in middleware.ts.
 */

export const metadata: Metadata = {
  // Absolute, or the root layout template renders "Magic Memorizer - Magic Memorizer".
  title: { absolute: uz.app.name },
  description: uz.landing.heroBody,
};

export default async function LandingPage() {
  const session = await getSession();
  const signedIn = session !== null;

  return (
    <>
      <section className="py-2xl gap-2xl grid items-center md:grid-cols-2">
        <div className="gap-lg flex flex-col">
          <h1 className="text-fg text-4xl">{uz.landing.heroTitle}</h1>
          <p className="text-fg-muted text-lg">{uz.landing.heroBody}</p>

          <div className="gap-sm flex flex-wrap">
            {signedIn ? (
              <CtaLink href="/decks">{uz.landing.ctaSignedIn}</CtaLink>
            ) : (
              <>
                <CtaLink href="/register">{uz.landing.ctaPrimary}</CtaLink>
                <CtaLink href="/login" variant="secondary">
                  {uz.landing.ctaSecondary}
                </CtaLink>
              </>
            )}
          </div>
        </div>

        <HeroVisual />
      </section>

      <ProblemsSection />
      <StepsSection />
      <RuleSection />
      <FinalCtaSection signedIn={signedIn} />
    </>
  );
}
