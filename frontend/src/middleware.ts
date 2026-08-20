import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/auth/cookies";
import { refreshTokens } from "@/lib/auth/refresh";
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

const PUBLIC_PATHS = ["/login", "/register"];

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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
  if (isPublic(pathname)) {
    return NextResponse.redirect(new URL("/decks", request.url));
  }

  const expiresAt = expiresAtRaw ? Number.parseInt(expiresAtRaw, 10) : null;
  const now = Math.floor(Date.now() / 1000);
  const expiringSoon =
    expiresAt !== null && Number.isFinite(expiresAt)
      ? expiresAt - now <= TOKEN_REFRESH_SKEW_SECONDS
      : true;

  if (accessToken && !expiringSoon) return NextResponse.next();

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

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|dev).*)"],
  // The refresh mutex hashes tokens with node:crypto, which the edge runtime
  // does not provide.
  runtime: "nodejs",
};
