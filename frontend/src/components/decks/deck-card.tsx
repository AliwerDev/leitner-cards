import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { deckAccentStyle } from "@/lib/domain/deck-color";
import type { Deck } from "@/types/api";

export function DeckCard({ deck, dueCount }: { deck: Deck; dueCount?: number }) {
  return (
    <Link href={`/decks/${deck.id}`} className="group block h-full">
      <Card
        variant="interactive"
        padding="none"
        className="flex h-full flex-col overflow-hidden min-h-2xl"
        style={deckAccentStyle(deck.color, deck.id)}
      >
        <div className="bg-accent h-1 rounded-t-lg" aria-hidden="true" />

        <div className="gap-sm p-md flex flex-1 flex-col">
          <div className="gap-xs flex items-start justify-between">
            <h3 className="text-fg text-lg leading-tight font-semibold">{deck.name}</h3>
            {dueCount !== undefined && dueCount > 0 ? (
              <Badge tone="accent" size="sm">
                {dueCount}
              </Badge>
            ) : null}
          </div>

          {deck.description ? (
            <p className="text-fg-muted line-clamp-2 text-sm">{deck.description}</p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
