// ADAPTED FROM frontend/src/lib/api/client.ts
//
// The pipeline is identical - build URL, compose signals, check content-type
// before parsing, unwrap the envelope, retry once on 401. What differs:
//
//   - No "server-only" and no `cache: "no-store"`. RN's fetch has no HTTP cache
//     to bypass, and the option is silently ignored.
//   - The token comes from SecureStore, not a cookie.
//   - The 401 retry is the PRIMARY refresh trigger, not a backstop. The web has
//     middleware refreshing ahead of every render; this app has no such layer.
//   - After a successful refresh the rotated tokens are persisted immediately,
//     which the web cannot do from a server component render.

import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { isEnvelope, type ApiEnvelope } from "./envelope";
import { ApiError, codeFromStatus } from "./error";
import { readPaginationHeaders, type Paginated } from "./paginated";
import { refreshTokens } from "@/lib/auth/refresh";
import { getCachedAccessToken, readTokens } from "@/lib/auth/storage";
import { uz } from "@/lib/i18n/uz";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;

export type ApiFetchOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Explicit token; otherwise read from storage. */
  token?: string;
  /** Set false for public endpoints such as /health. */
  auth?: boolean;
  /** Internal: false on the retry itself, so a loop is structurally impossible. */
  retryOnUnauthorized?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function resolveToken(options: ApiFetchOptions): Promise<string | undefined> {
  if (options.token) return options.token;
  if (options.auth === false) return undefined;

  // The in-memory copy avoids a native bridge hop on every request. It is
  // populated by bootstrap, sign-in, and refresh; the read below covers the
  // case where a request beats all three.
  const cached = getCachedAccessToken();
  if (cached) return cached;

  return (await readTokens())?.accessToken;
}

/**
 * Compose the caller's signal with our timeout without losing either.
 *
 * AbortSignal.any is newer than AbortSignal.timeout and is not guaranteed on
 * every Hermes build, so it is feature-detected rather than assumed.
 */
function buildSignal(caller?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(API_TIMEOUT_MS);
  if (!caller) return timeout;

  if (typeof AbortSignal.any === "function") return AbortSignal.any([caller, timeout]);

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (caller.aborted || timeout.aborted) abort();
  caller.addEventListener("abort", abort);
  timeout.addEventListener("abort", abort);
  return controller.signal;
}

async function rawFetch(path: string, options: ApiFetchOptions): Promise<Response> {
  const token = await resolveToken(options);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: buildSignal(options.signal),
    });
  } catch {
    // On a phone this is routine - airplane mode, a dead Wi-Fi captive portal,
    // the app waking with no connection. It must arrive as a typed error the
    // UI can render, never as a raw TypeError.
    throw new ApiError(0, "network", uz.errors.network);
  }
}

/**
 * Turn a response into either the unwrapped payload or a typed ApiError.
 *
 * The content-type is checked BEFORE calling json(). This is not defensive
 * tidiness: nginx serves the auth rate-limit 429 and its 502s as HTML, so
 * parsing first would throw a JSON syntax error on the login screen and lose
 * the status entirely.
 */
async function parse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    if (response.status === 429) {
      throw new ApiError(429, "rate_limited", uz.errors.rateLimited);
    }
    throw new ApiError(
      response.status,
      codeFromStatus(response.status),
      response.status >= 500 ? uz.errors.server : uz.errors.unexpected,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(response.status, "unknown", uz.errors.unexpected);
  }

  if (!isEnvelope(payload)) {
    // The beforeSend hook guarantees the envelope, so this should not happen.
    // Throwing beats returning `undefined as T` and failing further away.
    throw new ApiError(response.status, "unknown", uz.errors.unexpected);
  }

  const envelope = payload as ApiEnvelope<T>;

  if (!envelope.success) {
    const { code, message, name, fields } = envelope.error;
    throw new ApiError(
      code || response.status,
      codeFromStatus(code || response.status),
      message,
      fields,
      name,
    );
  }

  return envelope.data;
}

/** Refresh once and hand back a fresh access token, or null if that failed. */
async function refreshOnce(): Promise<string | null> {
  const stored = await readTokens();
  if (!stored) return null;

  const outcome = await refreshTokens(stored.refreshToken);
  return outcome.ok ? outcome.tokens.access_token : null;
}

function shouldRetry(response: Response, options: ApiFetchOptions): boolean {
  return (
    response.status === 401 && options.retryOnUnauthorized !== false && options.auth !== false
  );
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await rawFetch(path, options);

  if (shouldRetry(response, options)) {
    const token = await refreshOnce();
    if (token) {
      const retried = await rawFetch(path, {
        ...options,
        token,
        retryOnUnauthorized: false,
      });
      return parse<T>(retried);
    }
  }

  return parse<T>(response);
}

/**
 * Same pipeline, but captures the pagination headers before unwrapping.
 *
 * A separate function rather than a flag, so the return type stays exact
 * without conditional types. Unlike the browser, a native client can actually
 * read X-Pagination-* - CORS header filtering does not apply here, which is
 * what let this app drop the web's server proxy entirely.
 */
export async function apiFetchPaginated<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Paginated<T>> {
  let response = await rawFetch(path, options);

  if (shouldRetry(response, options)) {
    const token = await refreshOnce();
    if (token) {
      response = await rawFetch(path, { ...options, token, retryOnUnauthorized: false });
    }
  }

  const items = await parse<T[]>(response);
  return { items, pagination: readPaginationHeaders(response, items.length) };
}
