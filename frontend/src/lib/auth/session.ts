import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { me } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/error";
import { readRefreshToken } from "./cookies";
import type { SessionResponse } from "@/types/api";

export type Session = SessionResponse;

/**
 * The current session for this request.
 *
 * React.cache dedupes across every server component in one render pass, so the
 * layout, the page and a nav badge share a single /auth/me round trip.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  // No refresh token means no way back to an authenticated state; skip the call.
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return null;

  try {
    return await me();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) return null;
    // Rethrow everything else. Treating a 500 as "logged out" would silently
    // destroy a valid session during a backend blip.
    throw error;
  }
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
