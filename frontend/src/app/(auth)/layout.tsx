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
    <div className="bg-canvas flex min-h-dvh w-full flex-col">
      <header className="px-lg py-md flex items-center justify-between">
        <Link href="/login" className="gap-xs flex items-center">
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

      <main className="px-lg py-xl flex flex-1 items-center justify-center">
        <div className="w-full max-w-100">{children}</div>
      </main>

      <footer className="px-lg py-md text-2xs text-fg-subtle text-center">{uz.app.tagline}</footer>
    </div>
  );
}
