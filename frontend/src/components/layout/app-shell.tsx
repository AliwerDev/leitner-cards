import { NavIsland } from "./nav-island";
import { NavDock } from "./nav-dock";
import { cn } from "@/lib/utils/cn";
import type { Session } from "@/lib/auth/session";

/**
 * App chrome: a floating command island from md up, a floating dock below it.
 * There is no topbar - each page states its own title through PageHeader, and
 * neither the island nor the dock takes a column of its own, so content keeps
 * the full width at every breakpoint.
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
    <div className="bg-canvas flex min-h-dvh flex-col">
      <NavIsland dueCount={dueCount} username={session.user.username} />

      <main
        className={cn(
          "px-lg mx-auto w-full max-w-6xl flex-1",
          // The island floats above this padding on desktop; on mobile nothing
          // sits above the content, so the top gap stays modest.
          "pt-lg md:pt-md",
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
