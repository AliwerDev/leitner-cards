// COPIED FROM frontend/src/lib/api/endpoints/stats.ts (minus the "server-only" import).
// Keep in sync manually. See mobile/README.md.

import { apiFetch } from "../client";
import type { DailyStatsResponse, Stats } from "@/types/api";

/** The Stats object is the payload directly, not nested under a key. */
export function getStats(deckId?: number) {
  return apiFetch<Stats>("/stats", { query: { deckId } });
}

/**
 * Reviews per calendar day, oldest first. Every day in the window is present,
 * including days with no reviews, so the series can be charted as-is.
 */
export function getDailyStats(days = 30, deckId?: number) {
  return apiFetch<DailyStatsResponse>("/stats/daily", { query: { days, deckId } });
}
