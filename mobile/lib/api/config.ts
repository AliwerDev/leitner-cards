import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Where the API lives, resolved for whatever this build is running on.
 *
 * Three environments need three different hosts, and getting this wrong is the
 * single most common cause of "the app just spins" in React Native
 * development:
 *
 *   Android emulator  10.0.2.2  is the host machine's loopback
 *   iOS simulator     localhost is the host machine
 *   Physical device   the machine's LAN address
 *
 * Resolution order:
 *   1. EXPO_PUBLIC_API_BASE_URL, if set. Always wins.
 *   2. The host Metro is already serving this bundle from, with the API port
 *      substituted. A phone on the same Wi-Fi gets the right LAN address with
 *      no configuration, because Metro necessarily knows it.
 *   3. The platform default.
 */

/**
 * Typed as `unknown` on purpose.
 *
 * `extra` crosses a serialization boundary: app.config.ts runs in Node, and
 * what arrives here has been through Expo's config pipeline. Asserting a shape
 * with `as` only tells the compiler what to assume - it checks nothing at
 * runtime, and it is what let a previous version of this file crash on start.
 * Expo turns a `null` in the config into an empty object, `{}` is truthy, and
 * `{}.replace()` is not a function.
 *
 * So every value is read through a guard below rather than trusted.
 */
type Extra = {
  apiBaseUrl?: unknown;
  apiTimeoutMs?: unknown;
  tokenRefreshSkewSeconds?: unknown;
};

const extra: Extra = Constants.expoConfig?.extra ?? {};

/** A real, non-empty string, or null. Anything else from the config is noise. */
function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

const API_PORT = 8080;
const API_PATH = "/api/v1";

/** The loopback address that reaches the host machine from this platform. */
function platformLoopback(): string {
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
}

/**
 * The host Metro is serving from, e.g. "192.168.1.14:8081" on a LAN or
 * "localhost:8081" on a simulator. Undefined in a production build, which is
 * correct: a release build must be given an explicit URL.
 */
function metroHost(): string | null {
  const hostUri = readString(Constants.expoConfig?.hostUri);
  const host = hostUri?.split(":")[0];
  if (!host) return null;

  // A simulator reports localhost, which is right for iOS but means the
  // emulator itself on Android.
  if (host === "localhost" || host === "127.0.0.1") return platformLoopback();
  return host;
}

function resolveBaseUrl(): string {
  const override = readString(extra.apiBaseUrl);
  if (override !== null) return override.replace(/\/+$/, "");

  const host = metroHost() ?? platformLoopback();
  return `http://${host}:${API_PORT}${API_PATH}`;
}

export const API_BASE_URL = resolveBaseUrl();

export const API_TIMEOUT_MS = readNumber(extra.apiTimeoutMs, 10000);

/**
 * Refresh this many seconds before the access token actually expires, so a
 * request is never sent with a token that dies in flight.
 */
export const TOKEN_REFRESH_SKEW_SECONDS = readNumber(extra.tokenRefreshSkewSeconds, 120);
