"use client";

import { useState } from "react";
import { Button, EmptyState, Tooltip } from "@/components/ui";
import { Pagination } from "@/components/ui/pagination";
import { CardRow } from "./card-row";
import { CardSearch } from "./card-search";
import { CardFormDialog } from "./card-form-dialog";
import { CardBulkDialog } from "./card-bulk-dialog";
import { useSession } from "@/components/layout/session-provider";
import { cardsLabel, isDeckFull, cardLimitMessage } from "@/lib/domain/quota";
import { uz } from "@/lib/i18n/uz";
import type { Card } from "@/types/api";

export function CardList({
  deckId,
  cards,
  totalCount,
  currentPage,
  pageCount,
  query,
}: {
  deckId: number;
  cards: Card[];
  totalCount: number;
  currentPage: number;
  pageCount: number;
  query: string;
}) {
  const { quota } = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const full = isDeckFull(totalCount, quota);

  const addButton = (
    <Button onClick={() => setCreateOpen(true)} disabled={full}>
      {uz.card.create}
    </Button>
  );

  const bulkButton = (
    <Button variant="secondary" onClick={() => setBulkOpen(true)} disabled={full}>
      {uz.card.bulkCreate}
    </Button>
  );

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (page > 1) params.set("page", String(page));
    const search = params.toString();
    return search ? `/decks/${deckId}?${search}` : `/decks/${deckId}`;
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div className="flex flex-col gap-3xs">
          <h2 className="text-lg">{uz.card.title}</h2>
          <p className="text-sm text-fg-muted">{cardsLabel(totalCount, quota)}</p>
        </div>
        <div className="flex items-center gap-xs">
          {full ? (
            <Tooltip content={cardLimitMessage(quota)}>{bulkButton}</Tooltip>
          ) : (
            bulkButton
          )}
          {full ? <Tooltip content={cardLimitMessage(quota)}>{addButton}</Tooltip> : addButton}
        </div>
      </div>

      <CardSearch />

      {cards.length === 0 ? (
        <EmptyState
          icon="🗂"
          title={query ? uz.card.searchEmpty : uz.card.empty}
          description={query ? undefined : uz.card.emptyHint}
          action={!query && !full ? addButton : undefined}
        />
      ) : (
        <>
          <div className="rounded-lg border border-border bg-surface">
            {cards.map((card) => (
              <CardRow key={card.id} card={card} deckId={deckId} />
            ))}
          </div>
          <Pagination currentPage={currentPage} pageCount={pageCount} buildHref={buildHref} />
        </>
      )}

      <CardFormDialog open={createOpen} onOpenChange={setCreateOpen} deckId={deckId} />
      <CardBulkDialog open={bulkOpen} onOpenChange={setBulkOpen} deckId={deckId} />
    </div>
  );
}
