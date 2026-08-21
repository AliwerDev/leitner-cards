import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/auth/cookies";
import { refreshTokens } from "@/lib/auth/refresh";
import { isAdminToken } from "@/lib/auth/admin-check";
import { IS_PRODUCTION, TOKEN_REFRESH_SKEW_SECONDS } from "@/lib/api/config";

/**
 * Route protection plus proactive token refresh.
 *
 * This is the primary half of the single-flight design. Middleware runs once
 * per navigation, before any rendering, and - unlike a server component - can
 * write cookies onto the response. Refreshing here means there is exactly one
 * refresh in flight per navigation, so the in-render mutex in lib/auth/refresh
 * is a safety net rather than the normal path.
 *
 * The JWT signature is deliberately NOT verified here: that would require
 * JWT_SECRET in the edge bundle and buys nothing, because the PHP API is the
 * real authority and re-verifies every call. Middleware is a UX redirect;
 * requireSession() is the gate.
 */

/** The marketing page. Public, and the one public path a signed-in visitor keeps. */
const LANDING_PATH = "/";

const PUBLIC_PATHS = [LANDING_PATH, "/login", "/register"];

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/** Rewrite target for a denied /admin request. The page calls notFound(). */
const DENIED_PATH = "/denied";

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Deny a non-admin before the admin page renders.
 *
 * Scoped to /admin/*, so no other navigation pays for the check. Only a
 * positively verified "denied" rewrites; "unknown" falls through to the layout
 * gate in app/(app)/admin/layout.tsx, which has cookies() and a React.cache'd
 * /auth/me. This is defence in depth, not the only check.
 */
async function guardAdmin(
  request: NextRequest,
  response: NextResponse,
  accessToken: string | undefined,
): Promise<NextResponse> {
  if (!isAdminPath(request.nextUrl.pathname)) return response;
  // Nothing to check with; the layout decides.
  if (!accessToken) return response;

  const outcome = await isAdminToken(accessToken);

  if (outcome !== "denied") return response;

  const denied = NextResponse.rewrite(new URL(DENIED_PATH, request.url));

  // Carry over any freshly rotated cookies. Building the rewrite without them
  // throws away the new token pair, so the NEXT request presents a revoked
  // refresh token and the visitor is signed out for no visible reason.
  for (const cookie of response.cookies.getAll()) denied.cookies.set(cookie);

  return denied;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const refreshToken = request.cookies.get(COOKIE.refresh)?.value;
  const accessToken = request.cookies.get(COOKIE.access)?.value;
  const expiresAtRaw = request.cookies.get(COOKIE.expiresAt)?.value;

  // Signed out: protected routes bounce to login, public ones pass through.
  if (!refreshToken) {
    if (isPublic(pathname)) return NextResponse.next();

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Signed in and heading for the login page: send them to the app instead.
  // The landing page is the exception - it is shareable, and it swaps its own
  // calls to action for a signed-in visitor rather than needing a redirect.
  if (isPublic(pathname) && pathname !== LANDING_PATH) {
    return NextResponse.redirect(new URL("/decks", request.url));
  }

  const expiresAt = expiresAtRaw ? Number.parseInt(expiresAtRaw, 10) : null;
  const now = Math.floor(Date.now() / 1000);
  const expiringSoon =
    expiresAt !== null && Number.isFinite(expiresAt)
      ? expiresAt - now <= TOKEN_REFRESH_SKEW_SECONDS
      : true;

  if (accessToken && !expiringSoon) {
    return guardAdmin(request, NextResponse.next(), accessToken);
  }

  const outcome = await refreshTokens(refreshToken);

  if (!outcome.ok) {
    if (outcome.reason === "network") {
      // A backend blip must not sign the user out; let the render try.
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    for (const name of Object.values(COOKIE)) response.cookies.delete(name);
    return response;
  }

  const response = NextResponse.next();
  const { tokens } = outcome;
  const options = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(COOKIE.access, tokens.access_token, {
    ...options,
    maxAge: tokens.expires_in,
  });
  response.cookies.set(COOKIE.refresh, tokens.refresh_token, {
    ...options,
    maxAge: REFRESH_MAX_AGE,
  });
  response.cookies.set(COOKIE.expiresAt, String(now + tokens.expires_in), {
    ...options,
    maxAge: REFRESH_MAX_AGE,
  });

  // The token just minted, not the cookie, which is stale at this point.
  return guardAdmin(request, response, tokens.access_token);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|dev).*)"],
  // The refresh mutex hashes tokens with node:crypto, which the edge runtime
  // does not provide.
  runtime: "nodejs",
};
