import { API_BASE_URL, API_TIMEOUT_MS } from "@/lib/api/config";
import { isEnvelope } from "@/lib/api/envelope";
import type { SessionResponse } from "@/types/api";

/**
 * "unknown" means middleware could not decide - no token yet, a rotated token,
 * the backend down. The layout gate then answers with a real cookie-backed
 * session, so an admin is never falsely shown a 404.
 */
export type AdminCheck = "admin" | "denied" | "unknown";

/**
 * Is this access token's owner an administrator?
 *
 * Middleware-safe by construction: a bare fetch with an explicit token, no
 * cookies(), no apiFetch, and above all NO refresh. A 401 here is reported as
 * "unknown" rather than retried, so the single-flight refresh mutex in
 * lib/auth/refresh.ts sees exactly the call pattern it sees today.
 *
 * Called only for /admin/* navigations, which are rare by construction, so the
 * extra round trip costs nothing on any other route.
 */
export async function isAdminToken(accessToken: string): Promise<AdminCheck> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!response.ok) return "unknown";

    const payload: unknown = await response.json();

    if (!isEnvelope(payload) || !payload.success) return "unknown";

    const { user } = payload.data as SessionResponse;

    return user.is_admin ? "admin" : "denied";
  } catch {
    // Network failure or timeout: do not lock an admin out of their own panel.
    return "unknown";
  }
}
