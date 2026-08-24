// COPIED FROM frontend/src/lib/domain/limits.ts
// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.

/**
 * Backend limits that both server and client code need.
 *
 * Kept out of lib/api/endpoints/* because those modules are server-only, and a
 * client component importing one would pull the API client into the browser
 * bundle.
 */

/** CardController::MAX_SEARCH_LENGTH. */
export const MAX_SEARCH_LENGTH = 255;

/** Card::rules() - front and back are 1..1000 characters. */
export const MAX_CARD_SIDE_LENGTH = 1000;

/** Deck::rules() - name is 1..255 characters. */
export const MAX_DECK_NAME_LENGTH = 255;

/** CardBulkForm::MAX_ROWS - rows accepted by one bulk create. */
export const MAX_BULK_ROWS = 200;

/** ActiveDataProvider pageSize for decks and cards. */
export const PAGE_SIZE = 20;
