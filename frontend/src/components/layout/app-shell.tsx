import { NavRail } from "./nav-rail";
import { NavDock } from "./nav-dock";
import { cn } from "@/lib/utils/cn";
import type { Session } from "@/lib/auth/session";

/**
 * App chrome: an icon rail from md up, a floating dock below it. There is no
 * topbar - each page states its own title through PageHeader, which buys the
 * study card back the vertical space the bar used to hold.
 */
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
    <div className="bg-canvas flex min-h-dvh">
      <NavRail dueCount={dueCount} username={session.user.username} />

      <main
        className={cn(
          "px-lg py-lg mx-auto w-full max-w-6xl flex-1",
          // Clears the floating dock so the last card is never trapped under it.
          "pb-[calc(var(--shell-chrome-v)+var(--space-lg))] md:pb-lg",
        )}
      >
        {children}
      </main>

      <NavDock dueCount={dueCount} />
    </div>
  );
}
