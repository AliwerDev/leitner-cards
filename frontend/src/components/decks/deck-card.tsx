import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { deckAccentStyle } from "@/lib/domain/deck-color";
import { directionLabel } from "@/lib/domain/direction";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";

export function DeckCard({ deck, dueCount }: { deck: Deck; dueCount?: number }) {
  return (
    <Link href={`/decks/${deck.id}`} className="group block">
      {/* Re-point the accent role for this subtree: every bg-accent inside
          picks up the deck's own colour with no prop threading. */}
      <Card variant="interactive" padding="none" style={deckAccentStyle(deck.color, deck.id)}>
        <div className="h-1 rounded-t-lg bg-accent" aria-hidden="true" />

        <div className="flex flex-col gap-sm p-md">
          <div className="flex items-start justify-between gap-xs">
            <h3 className="text-lg leading-tight font-semibold text-fg">{deck.name}</h3>
            {dueCount !== undefined && dueCount > 0 ? (
              <Badge tone="accent" size="sm">
                {dueCount}
              </Badge>
            ) : null}
          </div>

          {deck.description ? (
            <p className="line-clamp-2 text-sm text-fg-muted">{deck.description}</p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-xs pt-2xs">
            <span className="text-2xs text-fg-subtle">{directionLabel(deck.direction)}</span>
            <span className="text-2xs font-medium text-accent-text group-hover:underline">
              {dueCount && dueCount > 0 ? uz.deck.startStudy : uz.common.edit}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
