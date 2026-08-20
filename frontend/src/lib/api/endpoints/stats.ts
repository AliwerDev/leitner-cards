import "server-only";

import { apiFetch } from "../client";
import type { Stats } from "@/types/api";

/** The Stats object is the payload directly, not nested under a key. */
export function getStats(deckId?: number) {
  return apiFetch<Stats>("/stats", { query: { deckId } });
}
