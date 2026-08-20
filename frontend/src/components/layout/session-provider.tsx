"use client";

import { createContext, useContext } from "react";
import type { Session } from "@/lib/auth/session";

const SessionContext = createContext<Session | null>(null);

/**
 * Makes the server-fetched session available to client components.
 *
 * It only passes down what the layout already fetched - no fetching of its
 * own, so there is no client waterfall.
 */
export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>.");
  return session;
}
