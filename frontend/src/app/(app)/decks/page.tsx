import type { Metadata } from "next";
import { DeckList } from "@/components/decks/deck-list";
import { listDecks } from "@/lib/api/endpoints/decks";
import { getDueCount } from "@/lib/api/endpoints/reviews";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.deck.title };

/**
 * Fanning out one due-count request per deck is free for a Regular account
 * (3 decks) but would be self-inflicted load for a Premium user with 200.
 * Past this many decks the counts appear on the detail page instead.
 */
const DUE_COUNT_FANOUT_LIMIT = 12;

export default async function DecksPage() {
  const decks = await listDecks();

  let dueCounts: Record<number, number> = {};

  if (decks.length > 0 && decks.length <= DUE_COUNT_FANOUT_LIMIT) {
    const counts = await Promise.all(
      decks.map(async (deck) => {
        try {
          const { due_count } = await getDueCount(deck.id);
          return [deck.id, due_count] as const;
        } catch {
          return [deck.id, 0] as const;
        }
      }),
    );
    dueCounts = Object.fromEntries(counts);
  }

  return <DeckList decks={decks} dueCounts={dueCounts} />;
}
