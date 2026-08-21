import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { uz } from "@/lib/i18n/uz";

/**
 * Shell for the public marketing page.
 *
 * Unlike the auth shell this is reachable while signed in, so the logo points
 * at the landing page itself rather than at /login.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-canvas flex min-h-dvh w-full flex-col">
      <header className="px-lg py-md mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="gap-xs flex items-center">
          <span
            className="bg-accent text-fg-on-accent flex size-8 items-center justify-center rounded-md text-sm font-semibold"
            aria-hidden="true"
          >
            M
          </span>
          <span className="font-semibold">{uz.app.name}</span>
        </Link>
        <ThemeToggle />
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
