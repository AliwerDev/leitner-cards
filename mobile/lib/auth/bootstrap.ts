import { TOKEN_REFRESH_SKEW_SECONDS } from "@/lib/api/config";
import { ApiError } from "@/lib/api/error";
import { me } from "@/lib/api/endpoints/auth";
import { refreshTokens } from "./refresh";
import { clearTokens, isExpiring, readTokens } from "./storage";
import type { Quota, User } from "@/types/api";

/**
 * Answer "is this user signed in?" on a cold start.
 *
 * The web answers this in middleware, before a single component renders. There
 * is no middleware here, so it happens once, explicitly, while the splash
 * screen is still up.
 *
 * THE OFFLINE STATE IS THE POINT. A user opening the app on the underground,
 * holding a refresh token that is good for thirty days, must not be dumped onto
 * the login screen. Only two things end a session:
 *
 *   - the refresh endpoint rejecting the token outright (401)
 *   - /auth/me returning 401
 *
 * Anything else - no connection, a 500, a timeout - keeps the tokens and
 * reports `offline`. The screens then show their own error states with a retry,
 * which is recoverable. Signing the user out is not.
 */

export type BootstrapResult =
  | { status: "signed-in"; user: User; quota: Quota }
  | { status: "signed-out" }
  | { status: "offline" };

export async function bootstrapSession(): Promise<BootstrapResult> {
  const stored = await readTokens();
  if (!stored) return { status: "signed-out" };

  // Refresh ahead of time when the access token is expired or nearly so. This
  // is the mobile stand-in for the web's proactive middleware refresh, and it
  // keeps the common case off the reactive 401 path where several screens
  // would contend for one single-use refresh token.
  if (isExpiring(stored.expiresAt, TOKEN_REFRESH_SKEW_SECONDS)) {
    const outcome = await refreshTokens(stored.refreshToken);

    if (!outcome.ok) {
      if (outcome.reason === "invalid") {
        await clearTokens();
        return { status: "signed-out" };
      }
      return { status: "offline" };
    }
  }

  try {
    const { user, quota } = await me();
    return { status: "signed-in", user, quota };
  } catch (error) {
    // 401 here means the account was blocked, deleted, or demoted server-side:
    // findIdentity() resolves only active users, and it re-reads on every
    // request. That is a real sign-out.
    if (error instanceof ApiError && error.isUnauthorized) {
      await clearTokens();
      return { status: "signed-out" };
    }
    return { status: "offline" };
  }
}
