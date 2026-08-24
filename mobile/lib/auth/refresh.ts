import { API_BASE_URL, API_TIMEOUT_MS } from "@/lib/api/config";
import { isEnvelope } from "@/lib/api/envelope";
import { saveTokens } from "./storage";
import type { AuthResponse, TokenPair } from "@/types/api";

/**
 * Single-flight refresh. Ported from frontend/src/lib/auth/refresh.ts.
 *
 * THE PROBLEM is the same one the web has, and it bites harder here. Refresh
 * tokens are single-use and rotating: AuthController::actionRefresh sets
 * revoked_at on the token it was given. If three screens each hit a 401 and
 * each POST the same refresh token, the first rotates it and the other two
 * present a revoked token, get 401, and the user is logged out despite a valid
 * session.
 *
 * WHY IT IS WORSE ON MOBILE. The web has middleware that refreshes proactively
 * before any render, so contention is rare and this mutex is a backstop. There
 * is no middleware here. Three tab screens mounting at once on a cold start,
 * each firing a query against an expired access token, is the NORMAL startup
 * path. lib/auth/bootstrap.ts refreshes before the tabs mount to keep that off
 * the critical path, but this mutex is what makes it safe when it happens
 * anyway.
 *
 * ONE THING IS EASIER HERE. The web notes that "the rotated tokens cannot be
 * written to cookies from a server component render" and leans on the grace
 * window to bridge until middleware catches up. React Native has no such
 * restriction: performRefresh writes to SecureStore directly, so the grace
 * window is a pure safety net rather than load-bearing.
 */

export type RefreshOutcome =
  | { ok: true; tokens: TokenPair; user: AuthResponse["user"] }
  | { ok: false; reason: "invalid" | "network" };

type RotationRecord = { tokens: TokenPair; user: AuthResponse["user"]; at: number };

const inFlight = new Map<string, Promise<RefreshOutcome>>();
const recentlyRotated = new Map<string, RotationRecord>();

const ROTATION_GRACE_MS = 30_000;

/**
 * Called when the server rejects a refresh token outright, which means the
 * session is over and the app must sign out. Set by AuthProvider - this module
 * cannot call a React hook, and an import back into the provider would be a
 * cycle.
 */
let onInvalid: (() => void) | null = null;

export function setInvalidSessionHandler(handler: (() => void) | null): void {
  onInvalid = handler;
}

export async function refreshTokens(refreshToken: string): Promise<RefreshOutcome> {
  /**
   * KEYED ON THE RAW TOKEN, NOT A HASH.
   *
   * The web hashes with node:crypto so the token never becomes a map key. That
   * module does not exist here, and its replacement - expo-crypto's
   * digestStringAsync - is ASYNC. An async key derivation would make the
   * inFlight.get() check below race, which is the exact failure this module
   * exists to prevent. The map is process-local, never serialized, and the
   * token is already in memory in the request body a few lines down.
   *
   * The rule that follows: never log this key, and never put it in a crash
   * report or an analytics breadcrumb.
   */
  const key = refreshToken;

  // Someone already rotated this exact token moments ago: reuse their result.
  // Without this, a caller that read the old token before the winner finished
  // writing would start a second refresh and fail.
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
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (response.status === 401) {
        onInvalid?.();
        return { ok: false, reason: "invalid" };
      }
      return { ok: false, reason: "network" };
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

    // Persist inside the mutex so exactly one winner writes, and so the tokens
    // survive the app being killed a moment later.
    await saveTokens(tokens);

    return { ok: true, tokens, user: data.user };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    // Cleared in a microtask so same-tick joiners still find the promise.
    queueMicrotask(() => inFlight.delete(key));
    setTimeout(() => recentlyRotated.delete(key), ROTATION_GRACE_MS);
  }
}

/** Drop every cached rotation. Called on sign-out so nothing leaks into the next session. */
export function resetRefreshState(): void {
  inFlight.clear();
  recentlyRotated.clear();
}
