"use client";

import { useState } from "react";
import { Alert, Button, EmptyState, Tooltip } from "@/components/ui";
import { DeckCard } from "./deck-card";
import { DeckFormDialog } from "./deck-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/components/layout/session-provider";
import { canCreateDeck, decksLabel, deckLimitMessage, isLastDeckSlot } from "@/lib/domain/quota";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";

export type DeckCounts = { total: number; due: number };

/** Decks past the page's fanout limit arrive without counts. */
const NO_COUNTS: DeckCounts = { total: 0, due: 0 };

export function DeckList({
  decks,
  deckCounts,
}: {
  decks: Deck[];
  deckCounts: Record<number, DeckCounts>;
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
    <div className="gap-lg flex flex-col">
      <PageHeader
        title={uz.deck.title}
        subtitle={decksLabel(quota)}
        action={
          canCreate ? (
            createButton
          ) : (
            <Tooltip content={deckLimitMessage(quota)}>{createButton}</Tooltip>
          )
        }
      />

      {isLastDeckSlot(quota) ? <Alert tone="warning" title={uz.quota.lastDeckSlot} /> : null}

      {decks.length === 0 ? (
        <EmptyState
          icon="📚"
          title={uz.deck.empty}
          description={uz.deck.emptyHint}
          action={canCreate ? createButton : undefined}
        />
      ) : (
        <div className="gap-md grid sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => {
            const counts = deckCounts[deck.id] ?? NO_COUNTS;
            return (
              <DeckCard
                key={deck.id}
                deck={deck}
                totalCards={counts.total}
                dueCount={counts.due}
              />
            );
          })}
        </div>
      )}

      <DeckFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
