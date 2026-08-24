import type { DueCard } from "@/types/api";

/**
 * A React key that changes when the study queue changes.
 *
 * The session keeps its progress in a reducer, so a screen must remount it when
 * a different queue arrives. Joining every card id says "different queue"
 * exactly, but a whole queue is now up to 2000 cards, and that builds a string
 * of about 12 KB on every render.
 *
 * The length plus the first and last id identify a queue well enough here. The
 * server orders the queue by schedule and then by id, so two different queues
 * that agree on all three are the same set of cards in the same order.
 */
export function queueKey(cards: DueCard[]): string {
  const first = cards[0];
  const last = cards[cards.length - 1];

  if (first === undefined || last === undefined) return "empty";

  return `${cards.length}:${first.id}-${last.id}`;
}
