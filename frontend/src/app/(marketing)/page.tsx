import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { Hero } from "@/components/marketing/hero";
import { JourneySection } from "@/components/marketing/journey-section";
import { FinalCtaSection } from "@/components/marketing/sections";
import { uz } from "@/lib/i18n/uz";

/**
 * The public landing page.
 *
 * Reading the session costs one /auth/me call, which is what lets a signed-in
 * visitor see "go to the app" instead of "sign up". Middleware lets this path
 * through in both states; see LANDING_PATH in middleware.ts.
 *
 * This stays a server component. Hero and JourneySection animate and so are
 * client components, but they take signedIn as a prop rather than reading the
 * session themselves.
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
      <Hero signedIn={signedIn} />
      <JourneySection />
      <FinalCtaSection signedIn={signedIn} />
    </>
  );
}
