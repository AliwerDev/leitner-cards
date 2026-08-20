"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog, Badge, Button, Dropdown } from "@/components/ui";
import { DeckFormDialog } from "./deck-form-dialog";
import { deleteDeckAction } from "@/lib/actions/decks";
import { deckAccentStyle } from "@/lib/domain/deck-color";
import { directionLabel } from "@/lib/domain/direction";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";

export function DeckHeader({ deck, dueCount }: { deck: Deck; dueCount: number }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteDeckAction(deck.id);
      router.push("/decks");
    });
  };

  return (
    <div className="flex flex-col gap-md" style={deckAccentStyle(deck.color, deck.id)}>
      <div className="flex items-start justify-between gap-md">
        <div className="flex min-w-0 flex-col gap-2xs">
          <div className="flex items-center gap-xs">
            <span className="size-3 rounded-full bg-accent" aria-hidden="true" />
            <h1 className="truncate text-2xl">{deck.name}</h1>
          </div>
          {deck.description ? (
            <p className="text-sm text-fg-muted">{deck.description}</p>
          ) : null}
          <div className="flex items-center gap-xs">
            <Badge size="sm">{directionLabel(deck.direction)}</Badge>
            {dueCount > 0 ? (
              <Badge tone="accent" size="sm">
                {uz.deck.dueCount(dueCount)}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-xs">
          {dueCount > 0 ? (
            <Link href={`/decks/${deck.id}/study`}>
              <Button>{uz.deck.startStudy}</Button>
            </Link>
          ) : null}

          <Dropdown
            ariaLabel={uz.common.edit}
            trigger={
              <span className="flex size-10 items-center justify-center rounded-md border border-border text-fg-muted hover:bg-surface-hover">
                ⋯
              </span>
            }
            items={[
              { label: uz.deck.edit, onSelect: () => setEditOpen(true) },
              { label: uz.common.delete, tone: "danger", onSelect: () => setDeleteOpen(true) },
            ]}
          />
        </div>
      </div>

      <DeckFormDialog open={editOpen} onOpenChange={setEditOpen} deck={deck} />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={uz.deck.deleteTitle}
        description={uz.deck.deleteConfirm(deck.name)}
        confirmLabel={uz.common.delete}
        pending={pending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
