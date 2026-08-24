// ADAPTED FROM frontend/src/lib/domain/format.ts
//
// Two changes, both forced by the runtime or by a bug the web version has.
//
// 1. No Intl. The web file already avoids Intl.RelativeTimeFormat with the
//    comment "has no uz locale data in every runtime, so the wording is spelled
//    out rather than risking an English fallback". Hermes ships an even smaller
//    ICU than a browser, so Intl.DateTimeFormat("uz-UZ") and
//    Intl.NumberFormat("uz-UZ") carry exactly the same risk of silently falling
//    back to English. Both are spelled out here for the same reason.
//
// 2. formatNextReview takes the progress object, not a timestamp. See the note
//    on that function.

import { uz } from "@/lib/i18n/uz";
import type { DueCardProgress } from "@/types/api";

/** All API timestamps are unix seconds; JS Date wants milliseconds. */
export function toDate(seconds: number): Date {
  return new Date(seconds * 1000);
}

const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;

/** "5 mart 2026" */
export function formatDate(seconds: number): string {
  const date = toDate(seconds);
  const month = MONTHS[date.getMonth()] ?? "";
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

/** "5 mart 2026, 14:30" */
export function formatDateTime(seconds: number): string {
  const date = toDate(seconds);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(seconds)}, ${hours}:${minutes}`;
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * Coarse relative time, in Uzbek.
 *
 * Intl.RelativeTimeFormat has no uz locale data in every runtime, so the
 * wording is spelled out rather than risking an English fallback.
 */
export function formatRelative(seconds: number, now = Date.now() / 1000): string {
  const delta = Math.round(seconds - now);
  const abs = Math.abs(delta);
  const future = delta > 0;

  if (abs < MINUTE) return future ? "hozir" : "hozirgina";

  const [value, unit] =
    abs < HOUR
      ? [Math.round(abs / MINUTE), "daqiqa"]
      : abs < DAY
        ? [Math.round(abs / HOUR), "soat"]
        : [Math.round(abs / DAY), "kun"];

  return future ? `${value} ${unit}dan keyin` : `${value} ${unit} oldin`;
}

/**
 * accuracy_7d is a ratio in 0..1, not a percentage, and is null when there
 * were no reviews in the window.
 */
export function formatAccuracy(ratio: number | null): string {
  if (ratio === null) return uz.common.noData;
  return `${Math.round(ratio * 100)}%`;
}

/** Uzbek does not group digits with a separator the way en-US does. */
export function formatCount(value: number): string {
  return String(value);
}

/**
 * A chart axis label for one day of the daily series, as DD/MM.
 *
 * The series sends "YYYY-MM-DD", which the backend bucketed in UTC. Reading the
 * parts out of the string keeps the label on the same day the backend counted -
 * a local-time reading shifts every label by a day for any user west of
 * Greenwich.
 */
export function formatDayShort(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (match === null) return day;
  const [, , month, dayOfMonth] = match;
  return `${dayOfMonth}/${month}`;
}

/**
 * When a due card comes back.
 *
 * This takes the progress object rather than a bare timestamp, because
 * `next_review_at: null` means two different things and the timestamp alone
 * cannot tell them apart:
 *
 *   is_new: true   -> never studied. Nothing is scheduled YET.
 *   is_mastered    -> finished the ladder. Nothing is scheduled EVER.
 *
 * The web version takes `number | null` and answers "O'zlashtirilgan" for both,
 * which labels every brand-new card as mastered. Worth fixing there too.
 */
export function formatNextReview(progress: DueCardProgress): string {
  if (progress.is_new) return uz.mobile.newCard;
  if (progress.next_review_at === null) return uz.study.mastered;

  const now = Date.now() / 1000;
  if (progress.next_review_at <= now) return uz.deck.noDue;
  return formatRelative(progress.next_review_at, now);
}

/** The same question for a plain CardProgress row, where null means mastered. */
export function formatScheduled(nextReviewAt: number | null): string {
  if (nextReviewAt === null) return uz.study.mastered;
  const now = Date.now() / 1000;
  if (nextReviewAt <= now) return uz.deck.noDue;
  return formatRelative(nextReviewAt, now);
}
