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

type Extra = {
  apiBaseUrl?: string | null;
  apiTimeoutMs?: number;
  tokenRefreshSkewSeconds?: number;
};

const extra: Extra = (Constants.expoConfig?.extra ?? {}) as Extra;

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
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (!host) return null;

  // A simulator reports localhost, which is right for iOS but means the
  // emulator itself on Android.
  if (host === "localhost" || host === "127.0.0.1") return platformLoopback();
  return host;
}

function resolveBaseUrl(): string {
  const override = extra.apiBaseUrl;
  if (override) return override.replace(/\/+$/, "");

  const host = metroHost() ?? platformLoopback();
  return `http://${host}:${API_PORT}${API_PATH}`;
}

export const API_BASE_URL = resolveBaseUrl();

export const API_TIMEOUT_MS = extra.apiTimeoutMs ?? 10000;

/**
 * Refresh this many seconds before the access token actually expires, so a
 * request is never sent with a token that dies in flight.
 */
export const TOKEN_REFRESH_SKEW_SECONDS = extra.tokenRefreshSkewSeconds ?? 120;
