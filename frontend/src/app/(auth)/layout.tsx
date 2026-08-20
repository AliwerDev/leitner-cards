import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { uz } from "@/lib/i18n/uz";

/**
 * Shell for signed-out pages.
 *
 * Middleware already redirects an authenticated visitor to /decks, so there is
 * no session check here.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center justify-between px-lg py-md">
        <Link href="/login" className="flex items-center gap-xs">
          <span
            className="flex size-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-fg-on-accent"
            aria-hidden="true"
          >
            L
          </span>
          <span className="font-semibold">{uz.app.name}</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-lg py-xl">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="px-lg py-md text-center text-2xs text-fg-subtle">{uz.app.tagline}</footer>
    </div>
  );
}
