/**
 * Query key factory.
 *
 * Keys are hierarchical so a prefix invalidates a whole family: invalidating
 * ["cards", deckId] catches every page and every search term for that deck
 * without the caller enumerating them.
 *
 * Two keys deserve care, both because the backend is account-wide where you
 * would expect it to be deck-scoped:
 *
 *   dueCount(undefined) is the badge on the Study tab. POST /reviews returns
 *   this number ignoring deckId, so a mutation inside one deck still changes it.
 *
 *   stats(undefined) covers reviews_today and accuracy_7d, which ReviewService
 *   computes per user and never filters by deck, even when deckId is passed.
 */
export const qk = {
  session: ["session"] as const,

  decks: ["decks"] as const,
  deck: (id: number) => ["decks", id] as const,
  deckStats: (id: number) => ["decks", id, "stats"] as const,

  cards: (deckId: number) => ["cards", deckId] as const,
  cardPage: (deckId: number, q: string, page: number) => ["cards", deckId, q, page] as const,
  cardCount: (deckId: number) => ["cards", deckId, "count"] as const,
  cardProgress: (id: number) => ["cardProgress", id] as const,

  due: (deckId?: number) => ["due", deckId ?? "all"] as const,
  dueCount: (deckId?: number) => ["dueCount", deckId ?? "all"] as const,

  stats: (deckId?: number) => ["stats", deckId ?? "all"] as const,
  daily: (days: number, deckId?: number) => ["stats", "daily", days, deckId ?? "all"] as const,
} as const;

/** Prefixes, for invalidating a whole family at once. */
export const qkPrefix = {
  /** Covers the deck list, every deck detail, and every deck's stats. */
  decks: ["decks"] as const,
  cards: ["cards"] as const,
  due: ["due"] as const,
  dueCount: ["dueCount"] as const,
  stats: ["stats"] as const,
} as const;
