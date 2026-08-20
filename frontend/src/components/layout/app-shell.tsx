import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { uz } from "@/lib/i18n/uz";
import type { Session } from "@/lib/auth/session";

export function AppShell({
  session,
  dueCount,
  children,
}: {
  session: Session;
  dueCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-[--z-sticky] border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-md px-lg">
          <Link href="/decks" className="flex items-center gap-xs">
            <span
              className="flex size-7 items-center justify-center rounded-md bg-accent text-xs font-semibold text-fg-on-accent"
              aria-hidden="true"
            >
              L
            </span>
            <span className="font-semibold">{uz.app.name}</span>
          </Link>

          <NavLinks dueCount={dueCount} />

          <div className="ml-auto flex items-center gap-xs">
            <ThemeToggle />
            <UserMenu username={session.user.username} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-lg py-xl">{children}</main>
    </div>
  );
}
