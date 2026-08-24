// COPIED FROM frontend/src/lib/domain/level.ts
// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.

import { CardLevel } from "@/types/api";

/**
 * Mirrors backend/enums/CardLevel.php.
 *
 * Labels come from the API in most payloads; these are the fallback for the
 * places where we only have a number (a level transition chip, a histogram).
 */

const LABELS: Record<CardLevel, string> = {
  1: "1-daraja",
  2: "2-daraja",
  3: "3-daraja",
  4: "4-daraja",
  5: "5-daraja",
  6: "6-daraja",
  7: "7-daraja",
  8: "O'zlashtirilgan",
};

/** Review interval per level, in days. Mastered is never rescheduled. */
const INTERVAL_DAYS: Record<CardLevel, number | null> = {
  1: 0,
  2: 2,
  3: 3,
  4: 7,
  5: 15,
  6: 31,
  7: 61,
  8: null,
};

export const MAX_LEVEL: CardLevel = CardLevel.Mastered;

export function levelLabel(level: CardLevel): string {
  return LABELS[level] ?? LABELS[1];
}

export function levelIntervalDays(level: CardLevel): number | null {
  return INTERVAL_DAYS[level] ?? null;
}

export function isMastered(level: CardLevel): boolean {
  return level === CardLevel.Mastered;
}

/** Correct: up one level, capped at Mastered. */
export function promote(level: CardLevel): CardLevel {
  return Math.min(level + 1, MAX_LEVEL) as CardLevel;
}

/** Wrong: always back to level 1 - the classic Leitner rule. */
export function demote(): CardLevel {
  return CardLevel.Level1;
}

export function nextLevel(level: CardLevel, wasCorrect: boolean): CardLevel {
  return wasCorrect ? promote(level) : demote();
}

/** Progress through the ladder as 0..1, for a bar or ring. */
export function levelProgress(level: CardLevel): number {
  return (level - 1) / (MAX_LEVEL - 1);
}

export const ALL_LEVELS: readonly CardLevel[] = [1, 2, 3, 4, 5, 6, 7, 8];
