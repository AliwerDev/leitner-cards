"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";

export function DeckFilter({ decks, selected }: { decks: Deck[]; selected?: number }) {
  const router = useRouter();

  return (
    <Select
      aria-label={uz.deck.one}
      value={selected ?? ""}
      onChange={(event) => {
        const value = event.target.value;
        router.push(value ? `/stats?deckId=${value}` : "/stats");
      }}
      options={[
        { value: "", label: uz.stats.allDecks },
        ...decks.map((deck) => ({ value: deck.id, label: deck.name })),
      ]}
    />
  );
}
