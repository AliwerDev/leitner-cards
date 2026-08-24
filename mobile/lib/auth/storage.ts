import * as SecureStore from "expo-secure-store";
import type { TokenPair } from "@/types/api";

/**
 * Token persistence.
 *
 * The web keeps these in httpOnly cookies, which is the right answer against
 * XSS in a browser and has no analogue here. SecureStore is the equivalent
 * trust boundary on a device: Keychain on iOS, EncryptedSharedPreferences on
 * Android.
 *
 * Key names match the web's cookie names so a grep for `leitner_at` finds both
 * implementations.
 *
 * THREE KEYS, NOT ONE BLOB. Two reasons: a partial write cannot corrupt the
 * whole session, and reading only `expiresAt` on the hot path does not have to
 * deserialize the tokens.
 *
 * SIZE. SecureStore rejects values over roughly 2048 bytes on some iOS
 * releases. The access token is an HS256 JWT with five claims (~200 bytes) and
 * the refresh token is a 64-character random string. Both are an order of
 * magnitude under the limit, so no chunking is needed - but do not start
 * storing anything larger here without re-checking that.
 */

const KEY = {
  access: "leitner_at",
  refresh: "leitner_rt",
  expiresAt: "leitner_at_exp",
} as const;

/**
 * Not migrated to a new device by a backup restore. A restored token would be
 * useless anyway - the account may have been logged out since - and this keeps
 * credentials off any backup.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  /** Unix seconds, matching every other timestamp in this app. */
  expiresAt: number;
};

/**
 * An in-process mirror of the access token.
 *
 * Every request needs it, and every SecureStore read is a native bridge hop.
 * The cache is written on load, sign-in, and refresh; `readTokens` repopulates
 * it, so nothing has to remember to prime it.
 */
let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export async function readTokens(): Promise<StoredTokens | null> {
  try {
    const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
      SecureStore.getItemAsync(KEY.access, OPTIONS),
      SecureStore.getItemAsync(KEY.refresh, OPTIONS),
      SecureStore.getItemAsync(KEY.expiresAt, OPTIONS),
    ]);

    // The refresh token is the one that matters. Without it there is no way
    // back from an expired access token, so treat the session as absent.
    if (!accessToken || !refreshToken) return null;

    const expiresAt = Number.parseInt(expiresAtRaw ?? "", 10);

    cachedAccessToken = accessToken;
    return {
      accessToken,
      refreshToken,
      // A missing or corrupt expiry reads as "already expired", which triggers
      // a refresh. That is the safe direction to fail in.
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
    };
  } catch {
    // A device with a broken keychain must land on the login screen, not crash.
    return null;
  }
}

export async function saveTokens(pair: TokenPair): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + pair.expires_in;
  cachedAccessToken = pair.access_token;

  await Promise.all([
    SecureStore.setItemAsync(KEY.access, pair.access_token, OPTIONS),
    SecureStore.setItemAsync(KEY.refresh, pair.refresh_token, OPTIONS),
    SecureStore.setItemAsync(KEY.expiresAt, String(expiresAt), OPTIONS),
  ]);
}

export async function clearTokens(): Promise<void> {
  cachedAccessToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(KEY.access, OPTIONS),
    SecureStore.deleteItemAsync(KEY.refresh, OPTIONS),
    SecureStore.deleteItemAsync(KEY.expiresAt, OPTIONS),
  ]);
}

/** True when the access token is expired, or close enough that it may die in flight. */
export function isExpiring(expiresAt: number, skewSeconds: number): boolean {
  return expiresAt - Date.now() / 1000 < skewSeconds;
}
