import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/layout/session-provider";
import { ToastProvider } from "@/components/ui";
import { getDueCount } from "@/lib/api/endpoints/reviews";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  // The badge is nice-to-have; a failure here must not take down the shell.
  let dueCount = 0;
  try {
    dueCount = (await getDueCount()).due_count;
  } catch {
    dueCount = 0;
  }

  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <AppShell session={session} dueCount={dueCount}>
          {children}
        </AppShell>
      </ToastProvider>
    </SessionProvider>
  );
}
