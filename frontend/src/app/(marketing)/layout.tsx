import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CtaLink } from "@/components/marketing/cta-link";
import { getSession } from "@/lib/auth/session";
import { uz } from "@/lib/i18n/uz";

/**
 * Shell for the public marketing page.
 *
 * Unlike the auth shell this is reachable while signed in, so the logo points
 * at the landing page itself rather than at /login. For the same reason the
 * header action reads the session: a signed-in visitor gets a way into the app
 * instead of a sign-in link they do not need.
 *
 * getSession is cached per request, so sharing it with the page below costs no
 * second /auth/me call.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const signedIn = (await getSession()) !== null;

  return (
    <div className="bg-canvas flex min-h-dvh w-full flex-col">
      {/* Sticky and translucent, matching the signed-in nav island. The blur
          needs a background that is not fully opaque, or it has nothing to
          work on. */}
      <header className="bg-canvas/85 border-border sticky top-0 z-(--z-sticky) w-full border-b backdrop-blur">
        <div className="px-lg py-md mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href="/" className="gap-xs flex items-center">
            <span
              className="bg-accent text-fg-on-accent flex size-7 items-center justify-center rounded-md text-sm font-semibold"
              aria-hidden="true"
            >
              M
            </span>
            <span className="font-semibold">{uz.app.name}</span>
          </Link>
          <div className="gap-sm flex items-center">
            <ThemeToggle />
            <CtaLink href={signedIn ? "/decks" : "/login"} size="sm">
              {signedIn ? uz.landing.ctaSignedIn : uz.landing.ctaSecondary}
            </CtaLink>
          </div>
        </div>
      </header>

      <main className="px-lg mx-auto w-full max-w-6xl flex-1">{children}</main>

      <footer className="px-lg py-lg mx-auto w-full max-w-6xl">
        <div className="border-border pt-md gap-2xs flex flex-col items-center border-t">
          <span className="text-fg-muted text-xs">{uz.app.tagline}</span>
          <span className="text-2xs text-fg-subtle">
            {uz.landing.footerRights(new Date().getFullYear())}
          </span>
        </div>
      </footer>
    </div>
  );
}
