"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog, Badge, Button, Dropdown } from "@/components/ui";
import { DeckFormDialog } from "./deck-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { deleteDeckAction } from "@/lib/actions/decks";
import { deckAccentStyle } from "@/lib/domain/deck-color";
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
    <div className="gap-md flex flex-col" style={deckAccentStyle(deck.color, deck.id)}>
      <PageHeader
        title={
          <span className="gap-xs flex min-w-0 items-center">
            <span className="bg-accent size-3 flex-none rounded-full" aria-hidden="true" />
            <span className="truncate">{deck.name}</span>
          </span>
        }
        accessory={
          <div className="gap-xs mt-3xs flex items-center">
            {dueCount > 0 ? (
              <Badge tone="accent" size="sm">
                {uz.deck.dueCount(dueCount)}
              </Badge>
            ) : null}
          </div>
        }
        action={
          <>
            {dueCount > 0 ? (
              <Link href={`/decks/${deck.id}/study`}>
                <Button>{uz.deck.startStudy}</Button>
              </Link>
            ) : null}

            <Dropdown
              ariaLabel={uz.common.edit}
              trigger={
                <span className="border-border text-fg-muted hover:bg-surface-hover flex size-10 items-center justify-center rounded-md border">
                  ⋯
                </span>
              }
              items={[
                { label: uz.deck.edit, onSelect: () => setEditOpen(true) },
                { label: uz.common.delete, tone: "danger", onSelect: () => setDeleteOpen(true) },
              ]}
            />
          </>
        }
      />

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
