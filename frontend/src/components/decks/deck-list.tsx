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

export function DeckList({
  decks,
  dueCounts,
}: {
  decks: Deck[];
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
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} dueCount={dueCounts[deck.id]} />
          ))}
        </div>
      )}

      <DeckFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
