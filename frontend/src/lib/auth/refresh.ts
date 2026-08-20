import "server-only";

import { createHash } from "crypto";
import { API_BASE_URL, API_TIMEOUT_MS } from "@/lib/api/config";
import { isEnvelope } from "@/lib/api/envelope";
import type { AuthResponse, TokenPair } from "@/types/api";

/**
 * Single-flight refresh.
 *
 * THE PROBLEM. Refresh tokens are single-use and rotating: AuthController
 * ::actionRefresh sets revoked_at on the token it was given. Next.js renders
 * server components concurrently, so if three of them each hit a 401 and each
 * POST the same refresh token, the first rotates it and the other two present
 * a revoked token, get 401, and the user is logged out despite a valid
 * session. This is the common case under load, not a rare race.
 *
 * THE DESIGN, in three parts:
 *   1. Middleware refreshes proactively, before rendering (see middleware.ts).
 *      That removes almost all contention, because middleware runs exactly
 *      once per navigation and can write cookies.
 *   2. This module coalesces anything left over: one in-flight request per
 *      token value, per process.
 *   3. `recentlyRotated` lets losers of the race reuse the winner's result
 *      instead of retrying with a token that is already dead.
 *
 * MULTI-INSTANCE CAVEAT. This mutex is per process. Behind two replicas, two
 * concurrent navigations could each refresh and one would lose its token. At
 * the current scale there is a single container, so it cannot happen. If that
 * changes, the options in order are sticky sessions, then a short-lived Redis
 * lock keyed on the token hash. Better still, the backend could accept a
 * just-rotated token for a few seconds and return the same new pair, which
 * removes the problem for every client - see the backend tickets in the plan.
 */

export type RefreshOutcome =
  | { ok: true; tokens: TokenPair; user: AuthResponse["user"] }
  | { ok: false; reason: "invalid" | "network" };

type RotationRecord = { tokens: TokenPair; user: AuthResponse["user"]; at: number };

const inFlight = new Map<string, Promise<RefreshOutcome>>();
const recentlyRotated = new Map<string, RotationRecord>();

const ROTATION_GRACE_MS = 30_000;

/** Never log or key on the raw token. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function refreshTokens(refreshToken: string): Promise<RefreshOutcome> {
  const key = hashToken(refreshToken);

  // Someone already rotated this exact token moments ago: reuse their result.
  // Without this, a request that read the old cookie before the winner's
  // response was written would start a second refresh and fail.
  const recent = recentlyRotated.get(key);
  if (recent && Date.now() - recent.at < ROTATION_GRACE_MS) {
    return { ok: true, tokens: recent.tokens, user: recent.user };
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const flight = performRefresh(refreshToken, key);
  inFlight.set(key, flight);
  return flight;
}

async function performRefresh(refreshToken: string, key: string): Promise<RefreshOutcome> {
  try {
    // /auth/refresh is a public action - no Bearer token required.
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { ok: false, reason: response.status === 401 ? "invalid" : "network" };
    }

    const payload: unknown = await response.json();
    if (!isEnvelope(payload) || !payload.success) {
      return { ok: false, reason: "network" };
    }

    const data = payload.data as AuthResponse;
    const tokens: TokenPair = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    };

    recentlyRotated.set(key, { tokens, user: data.user, at: Date.now() });
    return { ok: true, tokens, user: data.user };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    // Cleared in a microtask so same-tick joiners still find the promise.
    queueMicrotask(() => inFlight.delete(key));
    const timer = setTimeout(() => recentlyRotated.delete(key), ROTATION_GRACE_MS);
    timer.unref?.();
  }
}
