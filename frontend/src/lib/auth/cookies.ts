import "server-only";

import { cookies } from "next/headers";
import { IS_PRODUCTION } from "@/lib/api/config";
import type { TokenPair } from "@/types/api";

/** Cookie names live here only. No string literals elsewhere. */
export const COOKIE = {
  access: "leitner_at",
  refresh: "leitner_rt",
  expiresAt: "leitner_at_exp",
} as const;

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, matching the backend TTL

const BASE_OPTIONS = {
  httpOnly: true,
  // Must be off on http://localhost:3000 or the cookie is silently dropped.
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
} as const;

export type CookieWriter = {
  set: (name: string, value: string, options: Record<string, unknown>) => void;
  delete: (name: string) => void;
};

/**
 * Write the token trio.
 *
 * Accepts a writer so middleware can target a NextResponse while server
 * actions target the request cookie jar - the shapes are compatible.
 */
export function writeAuthCookies(store: CookieWriter, tokens: TokenPair): void {
  const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

  store.set(COOKIE.access, tokens.access_token, {
    ...BASE_OPTIONS,
    maxAge: tokens.expires_in,
  });
  store.set(COOKIE.refresh, tokens.refresh_token, {
    ...BASE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
  // Outlives the access token on purpose: once the access cookie expires we
  // would otherwise lose the ability to reason about *when* it expired.
  store.set(COOKIE.expiresAt, String(expiresAt), {
    ...BASE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(store: CookieWriter): void {
  store.delete(COOKIE.access);
  store.delete(COOKIE.refresh);
  store.delete(COOKIE.expiresAt);
}

export async function readAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE.access)?.value;
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE.refresh)?.value;
}

export async function readExpiresAt(): Promise<number | null> {
  const raw = (await cookies()).get(COOKIE.expiresAt)?.value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
