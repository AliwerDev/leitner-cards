import "server-only";

/**
 * The API address is a server secret.
 *
 * With the proxy architecture the browser never talks to the PHP API, so this
 * is deliberately NOT a NEXT_PUBLIC_ var - those get inlined into the client
 * bundle.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Fail the boot loudly. A missing base URL would otherwise produce
    // fetch("undefined/decks") requests into the void.
    throw new Error(`${name} is not set. Copy frontend/.env.example to .env.local.`);
  }
  return value;
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** http://nginx/api/v1 inside compose, http://localhost:8080/api/v1 on the host. */
export const API_BASE_URL = required("API_BASE_URL").replace(/\/+$/, "");

export const API_TIMEOUT_MS = optionalNumber("API_TIMEOUT_MS", 10_000);

/** Refresh the access token this many seconds before it expires. */
export const TOKEN_REFRESH_SKEW_SECONDS = optionalNumber("TOKEN_REFRESH_SKEW_SECONDS", 120);

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
