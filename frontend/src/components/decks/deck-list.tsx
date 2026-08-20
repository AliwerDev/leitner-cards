"use client";

import { useState } from "react";
import { Alert, Button, EmptyState, Tooltip } from "@/components/ui";
import { DeckCard } from "./deck-card";
import { DeckFormDialog } from "./deck-form-dialog";
import { useSession } from "@/components/layout/session-provider";
import { canCreateDeck, decksLabel, deckLimitMessage, isLastDeckSlot } from "@/lib/domain/quota";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";

export function DeckList({
  decks,
  dueCounts,
}: {
  decks: Deck[];
  /** Keyed by deck id. Empty when there are too many decks to fan out. */
  dueCounts: Record<number, number>;
}) {
  const { quota } = useSession();
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = canCreateDeck(quota);

  const createButton = (
    <Button onClick={() => setCreateOpen(true)} disabled={!canCreate}>
      {uz.deck.create}
    </Button>
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-col gap-3xs">
          <h1 className="text-2xl">{uz.deck.title}</h1>
          <p className="text-sm text-fg-muted">{decksLabel(quota)}</p>
        </div>

        {/* Disabled with an explanation, not hidden: a vanished button reads
            as a bug rather than a limit. */}
        {canCreate ? (
          createButton
        ) : (
          <Tooltip content={deckLimitMessage(quota)}>{createButton}</Tooltip>
        )}
      </div>

      {isLastDeckSlot(quota) ? <Alert tone="warning" title={uz.quota.lastDeckSlot} /> : null}

      {decks.length === 0 ? (
        <EmptyState
          icon="📚"
          title={uz.deck.empty}
          description={uz.deck.emptyHint}
          action={canCreate ? createButton : undefined}
        />
      ) : (
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} dueCount={dueCounts[deck.id]} />
          ))}
        </div>
      )}

      <DeckFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
