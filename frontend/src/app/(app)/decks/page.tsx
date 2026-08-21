import type { Metadata } from "next";
import { DeckList, type DeckCounts } from "@/components/decks/deck-list";
import { listDecks, getDeckStats } from "@/lib/api/endpoints/decks";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.deck.title };

/**
 * Fanning out one stats request per deck is free for a Regular account
 * (3 decks) but would be self-inflicted load for a Premium user with 200.
 * Past this many decks the counts appear on the detail page instead.
 */
const STATS_FANOUT_LIMIT = 12;

export default async function DecksPage() {
  const decks = await listDecks();

  let deckCounts: Record<number, DeckCounts> = {};

  if (decks.length > 0 && decks.length <= STATS_FANOUT_LIMIT) {
    const counts = await Promise.all(
      decks.map(async (deck) => {
        try {
          const { stats } = await getDeckStats(deck.id);
          return [deck.id, { total: stats.total_cards, due: stats.due_now }] as const;
        } catch {
          return [deck.id, { total: 0, due: 0 }] as const;
        }
      }),
    );
    deckCounts = Object.fromEntries(counts);
  }

  return <DeckList decks={decks} deckCounts={deckCounts} />;
}
