import "server-only";

import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { isEnvelope, type ApiEnvelope } from "./envelope";
import { ApiError, codeFromStatus } from "./error";
import { readPaginationHeaders, type Paginated } from "./paginated";
import { readAccessToken, readRefreshToken } from "@/lib/auth/cookies";
import { refreshTokens } from "@/lib/auth/refresh";
import { uz } from "@/lib/i18n/uz";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;

export type ApiFetchOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Explicit token; otherwise read from the access cookie. */
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
  return readAccessToken();
}

/** Compose the caller's signal with our timeout without losing either. */
function buildSignal(caller?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(API_TIMEOUT_MS);
  if (!caller) return timeout;
  return AbortSignal.any([caller, timeout]);
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
      // Every response is user-specific; a shared cache would leak data.
      cache: "no-store",
      signal: buildSignal(options.signal),
    });
  } catch {
    // Never let a raw "TypeError: fetch failed" reach a page.
    throw new ApiError(0, "network", uz.errors.network);
  }
}

/**
 * Turn a response into either the unwrapped payload or a typed ApiError.
 *
 * The content-type is checked BEFORE calling json(): nginx serves 429 and 502
 * as HTML, and a failing JSON.parse is an ambiguous signal where the header is
 * definitive.
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
    throw new ApiError(code || response.status, codeFromStatus(code || response.status), message, fields, name);
  }

  return envelope.data;
}

/**
 * The single server-side entry point to the PHP API.
 *
 * On 401 it refreshes once through the single-flight mutex and retries. Note
 * that the rotated tokens cannot be written to cookies from a server component
 * render - middleware handles that on the next request, and the mutex's grace
 * window keeps this process working until then.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await rawFetch(path, options);

  if (response.status === 401 && options.retryOnUnauthorized !== false && options.auth !== false) {
    const refreshToken = await readRefreshToken();
    if (refreshToken) {
      const outcome = await refreshTokens(refreshToken);
      if (outcome.ok) {
        const retried = await rawFetch(path, {
          ...options,
          token: outcome.tokens.access_token,
          retryOnUnauthorized: false,
        });
        return parse<T>(retried);
      }
    }
  }

  return parse<T>(response);
}

/**
 * Same pipeline, but captures the pagination headers before unwrapping.
 *
 * A separate function rather than a flag, so the return type stays exact
 * without conditional types.
 */
export async function apiFetchPaginated<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Paginated<T>> {
  let response = await rawFetch(path, options);

  if (response.status === 401 && options.retryOnUnauthorized !== false && options.auth !== false) {
    const refreshToken = await readRefreshToken();
    if (refreshToken) {
      const outcome = await refreshTokens(refreshToken);
      if (outcome.ok) {
        response = await rawFetch(path, {
          ...options,
          token: outcome.tokens.access_token,
          retryOnUnauthorized: false,
        });
      }
    }
  }

  const items = await parse<T[]>(response);
  return { items, pagination: readPaginationHeaders(response, items.length) };
}
