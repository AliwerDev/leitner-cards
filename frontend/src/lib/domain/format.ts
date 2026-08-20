import { uz } from "@/lib/i18n/uz";

/** All API timestamps are unix seconds; JS Date wants milliseconds. */
export function toDate(seconds: number): Date {
  return new Date(seconds * 1000);
}

const dateFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(seconds: number): string {
  return dateFormatter.format(toDate(seconds));
}

export function formatDateTime(seconds: number): string {
  return dateTimeFormatter.format(toDate(seconds));
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

export function formatCount(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

const dayShortFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * A chart axis label for one day of the daily series.
 *
 * The series sends "YYYY-MM-DD", which the backend bucketed in UTC. Parsing it
 * as UTC and formatting it back in UTC keeps the label on the same day the
 * backend counted - a local-time reading shifts every label by a day for any
 * user west of Greenwich.
 */
export function formatDayShort(day: string): string {
  const parsed = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return day;
  return dayShortFormatter.format(parsed);
}

/** "Takrorlash kerak" for a due card, otherwise when it comes back. */
export function formatNextReview(nextReviewAt: number | null): string {
  if (nextReviewAt === null) return uz.study.mastered;
  const now = Date.now() / 1000;
  if (nextReviewAt <= now) return uz.deck.noDue;
  return formatRelative(nextReviewAt, now);
}
