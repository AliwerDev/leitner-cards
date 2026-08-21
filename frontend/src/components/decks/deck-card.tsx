import Link from "next/link";
import { Layers } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { NAV_ICON_STROKE } from "@/components/layout/nav-links";
import { deckAccentStyle } from "@/lib/domain/deck-color";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";

export function DeckCard({
  deck,
  totalCards,
  dueCount,
}: {
  deck: Deck;
  totalCards: number;
  dueCount: number;
}) {
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
            {dueCount > 0 ? (
              <Badge tone="accent" size="sm">
                {dueCount}
              </Badge>
            ) : null}
          </div>

          <div className="gap-2xs mt-auto text-fg-muted flex items-center text-sm">
            <Layers className="size-4 flex-none" strokeWidth={NAV_ICON_STROKE} aria-hidden="true" />
            {totalCards > 0 ? (
              <>
                <span>{uz.deck.cardCountLabel(totalCards)}</span>
                {dueCount > 0 ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-accent-text">{uz.deck.readyCount(dueCount)}</span>
                  </>
                ) : null}
              </>
            ) : (
              <span>{uz.deck.noCards}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
