/**
 * The wire contract with the Yii2 backend.
 *
 * This file imports nothing on purpose - not zod, not React, not Next. The
 * planned React Native app consumes the same definitions, so keeping it
 * dependency-free means it can move to a shared package with a `git mv`.
 *
 * Field lists mirror each model's fields() exactly. Anything not listed there
 * is NOT serialized, however much it looks like it should be.
 */

/* ── Enums ─────────────────────────────────────────────────────────────────
   Const objects rather than TS `enum`: they erase cleanly, compare as plain
   JSON numbers, and give Object.values() for free. */

export const CardLevel = {
  Level1: 1,
  Level2: 2,
  Level3: 3,
  Level4: 4,
  Level5: 5,
  Level6: 6,
  Level7: 7,
  Mastered: 8,
} as const;
export type CardLevel = (typeof CardLevel)[keyof typeof CardLevel];

export const DeckDirection = {
  FrontToBack: 1,
  BackToFront: 2,
} as const;
export type DeckDirection = (typeof DeckDirection)[keyof typeof DeckDirection];

export const UserType = {
  Regular: 1,
  Premium: 10,
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];

/* ── Entities ───────────────────────────────────────────────────────────── */

/** All timestamps across the API are unix SECONDS, not milliseconds. */
export type UnixSeconds = number;

export type User = {
  id: number;
  username: string;
  email: string;
  type: UserType;
  type_label: string;
  is_premium: boolean;
  created_at: UnixSeconds;
};

export type Quota = {
  type: UserType;
  type_label: string;
  is_unlimited: boolean;
  /** null means unlimited (Premium). */
  max_decks: number | null;
  max_cards_per_deck: number | null;
  decks_used: number;
  decks_remaining: number | null;
};

export type Deck = {
  id: number;
  name: string;
  description: string | null;
  /** Palette index, not a hex value. See lib/domain/deck-color.ts. */
  color: number | null;
  /** Nullable in the DB, and fields() serializes the raw column. Normalize
   *  through lib/domain/direction.ts rather than switching on it directly. */
  direction: DeckDirection | null;
  direction_label: string;
  created_at: UnixSeconds;
  updated_at: UnixSeconds;
};

/** Note: deck_id is NOT part of Card::fields(). Only DueCard carries it. */
export type Card = {
  id: number;
  front: string;
  back: string;
  created_at: UnixSeconds;
  updated_at: UnixSeconds;
};

export type CardProgress = {
  id: number;
  current_level: CardLevel;
  level_label: string;
  is_mastered: boolean;
  last_reviewed_at: UnixSeconds | null;
  /** null once mastered: nothing further is scheduled. */
  next_review_at: UnixSeconds | null;
  created_at: UnixSeconds;
  updated_at: UnixSeconds;
};

export type ReviewHistory = {
  id: number;
  card_id: number;
  level_before: CardLevel;
  level_after: CardLevel;
  was_correct: boolean;
  reviewed_at: UnixSeconds;
};

/* ── Due cards ──────────────────────────────────────────────────────────────
   The progress object is asymmetric, which is why this is a discriminated
   union rather than an optional-field type: a card that has never been studied
   carries only six keys - no id, no created_at, no updated_at. Reading
   `progress.id` without narrowing on `is_new` must be a compile error, because
   at runtime it is undefined and renders as a blank UI. */

export type NewCardProgress = {
  is_new: true;
  current_level: CardLevel;
  level_label: string;
  is_mastered: boolean;
  last_reviewed_at: null;
  next_review_at: null;
};

export type ExistingCardProgress = CardProgress & { is_new: false };

export type DueCardProgress = NewCardProgress | ExistingCardProgress;

export type DueCard = Card & {
  deck_id: number;
  direction: DeckDirection;
  /** Server-resolved for the deck's direction. Never re-derive from front/back. */
  prompt: string;
  answer: string;
  progress: DueCardProgress;
};

/* ── Stats ──────────────────────────────────────────────────────────────── */

export type LevelBucket = {
  level: CardLevel;
  label: string;
  count: number;
};

export type Stats = {
  total_cards: number;
  due_now: number;
  mastered: number;
  not_started: number;
  /** Always 8 entries, levels 1..8, zeros included. */
  by_level: LevelBucket[];
  /** Rolling 24 hours, not a calendar day. */
  reviews_today: number;
  /** A ratio in 0..1 rounded to 2dp - NOT a percentage. null when no reviews. */
  accuracy_7d: number | null;
};

/* ── Auth payloads ──────────────────────────────────────────────────────── */

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthResponse = TokenPair & { user: User };

export type SessionResponse = { user: User; quota: Quota };

/* ── Endpoint response shapes ───────────────────────────────────────────── */

export type DeckResponse = { deck: Deck };
export type DeckStatsResponse = { deck: Deck; stats: Stats };
export type CardResponse = { card: Card };
export type CardProgressResponse = {
  card: Card;
  progress: CardProgress;
  history: ReviewHistory[];
};
export type DueResponse = { count: number; cards: DueCard[] };
export type DueCountResponse = { due_count: number };
export type ReviewResponse = {
  review: ReviewHistory;
  progress: CardProgress;
  /** Account-wide, ignoring the deck being studied. */
  due_count: number;
};
export type ResetResponse = { progress: CardProgress; due_count: number };
export type MessageResponse = { message: string };
export type HealthResponse = { status: string; db: boolean; time: string };
