// COPIED FROM frontend/src/types/api.ts
// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.

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

export const UserRole = {
  User: 1,
  Admin: 10,
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Account status. Mirrors backend/enums/UserStatus.php.
 *
 * Three states, not a boolean: Deleted is what DELETE /admin/users/{id}
 * produces (a soft delete), and a blocked account is Inactive. The backend's
 * findIdentity() resolves only Active, so a status change ends the account's
 * access on its next request.
 */
export const UserStatus = {
  Deleted: 0,
  Inactive: 5,
  Active: 10,
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

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
  /** Added to User::fields() so the client knows whether to offer the panel. */
  role: UserRole;
  role_label: string;
  is_admin: boolean;
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

export type DailyPoint = {
  /** Calendar day, UTC, as YYYY-MM-DD. */
  day: string;
  reviews: number;
  correct: number;
  /** A ratio in 0..1, or null on a day with no reviews. */
  accuracy: number | null;
};

/* ── Admin ──────────────────────────────────────────────
   Only the /admin endpoints return these. AdminUser is User plus the columns
   User::fields() withholds from a normal caller. */

export type AdminUser = User & {
  status: UserStatus;
  status_label: string;
  is_active: boolean;
  updated_at: UnixSeconds;
};

/** Per-user counters on the admin detail screen. */
export type AdminUserCounts = {
  decks: number;
  cards: number;
  reviews: number;
  /** Unrevoked, unexpired refresh tokens. */
  active_sessions: number;
};

/**
 * One histogram bucket.
 *
 * A list rather than a value-keyed map: PHP serializes an empty int-keyed array
 * as [] and a populated one as an object, so a map would change JSON type with
 * the data. The label is the backend's Uzbek text.
 */
export type AdminBucket = {
  value: number;
  label: string;
  count: number;
};

export type AdminDayPoint = DailyPoint & {
  /** Distinct users who reviewed that day. */
  users: number;
};

export type AdminStats = {
  users: {
    total: number;
    active: number;
    registered_30d: number;
    by_type: AdminBucket[];
    by_role: AdminBucket[];
    by_status: AdminBucket[];
  };
  content: {
    decks: number;
    cards: number;
    cards_started: number;
    empty_decks: number;
  };
  reviews: {
    days: number;
    total_30d: number;
    /** A ratio in 0..1, or null when nothing was reviewed. */
    accuracy_30d: number | null;
    active_users_30d: number;
    series: AdminDayPoint[];
  };
  generated_at: UnixSeconds;
};

export type AdminUserListResponse = AdminUser[];
export type AdminUserResponse = {
  user: AdminUser;
  revoked_sessions: number;
  message: string;
};
export type AdminUserDetailResponse = {
  user: AdminUser;
  quota: Quota;
  counts: AdminUserCounts;
};
export type AdminUserStatsResponse = {
  user: AdminUser;
  stats: Stats;
  days: DailyPoint[];
};
export type AdminPasswordResponse = {
  revoked_sessions: number;
  message: string;
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
export type DailyStatsResponse = { days: DailyPoint[] };
export type CardResponse = { card: Card };
export type CardBulkResponse = { created: number; cards: Card[] };
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
  /**
   * True when the request carried a clientId that had already been recorded,
   * so nothing was applied a second time. Always false without one, which is
   * every request the web makes.
   */
  duplicate: boolean;
};
export type ResetResponse = { progress: CardProgress; due_count: number };
export type MessageResponse = { message: string };
export type HealthResponse = { status: string; db: boolean; time: string };
