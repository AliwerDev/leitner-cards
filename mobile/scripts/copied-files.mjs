/**
 * The manifest of files copied verbatim from the web frontend.
 *
 * The mobile app is a standalone project, not a workspace member, so these
 * files exist twice. That is a deliberate trade (no monorepo wiring, no Docker
 * changes for the frontend container) with one cost: they drift silently when
 * the backend contract changes. `npm run check-sync` compares them and this
 * list is what it reads.
 *
 * Files adapted for React Native are NOT listed here - they are expected to
 * differ. See mobile/README.md for which ones and why.
 */
export const COPIED_FILES = [
  "types/api.ts",
  "types/ui.ts",
  "lib/api/error.ts",
  "lib/api/envelope.ts",
  "lib/i18n/api-errors.ts",
  "lib/validation/messages.ts",
  "lib/validation/zod-errors.ts",
  "lib/validation/auth.ts",
  "lib/validation/card.ts",
  "lib/domain/level.ts",
  "lib/domain/limits.ts",
  "lib/domain/quota.ts",
  "lib/domain/direction.ts",
  "lib/domain/stats-range.ts",
  "lib/domain/card-parse.ts",
];
