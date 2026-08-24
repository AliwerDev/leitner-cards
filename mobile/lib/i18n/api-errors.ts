// COPIED FROM frontend/src/lib/i18n/api-errors.ts
// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.

import { ApiError } from "@/lib/api/error";
import { uz } from "./uz";

/**
 * Map an ApiError onto Uzbek copy.
 *
 * The backend's own messages are mostly Uzbek and good enough to show as-is -
 * the quota and ownership messages especially. The auth messages are English
 * ("Incorrect login or password."), so those are matched on status rather than
 * displayed verbatim, which would break the language of the UI.
 */
export function apiErrorMessage(error: ApiError): string {
  switch (error.code) {
    case "network":
      return uz.errors.network;
    case "rate_limited":
      return uz.errors.rateLimited;
    case "unauthorized":
      return uz.errors.invalidCredentials;
    case "not_found":
      // The backend's 404 text is already Uzbek and more specific than ours.
      return error.message || uz.errors.notFound;
    case "server":
      return uz.errors.server;
    case "validation":
      return error.message || uz.errors.unexpected;
    default:
      return error.message || uz.errors.unexpected;
  }
}

/**
 * Field errors for a form, in Uzbek.
 *
 * Quota failures arrive as 422 on `name` (deck) or `deckId` (card), but they
 * are about the account rather than the field, so callers lift those to a
 * form-level alert - see hasAccountLevelError below.
 */
export function apiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.fields) return {};

  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.fields)) {
    const first = messages[0];
    if (first) result[field] = first;
  }
  return result;
}

/** Quota messages mention limits and belong above the form, not under a field. */
export function isQuotaError(error: unknown): boolean {
  if (!(error instanceof ApiError) || !error.isValidation) return false;
  const messages = Object.values(error.fields ?? {}).flat();
  return messages.some((message) => message.includes("limiti tugadi"));
}
