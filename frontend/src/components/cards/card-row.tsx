"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog, Dropdown } from "@/components/ui";
import { CardFormDialog } from "./card-form-dialog";
import { deleteCardAction } from "@/lib/actions/cards";
import { formatDate } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import type { Card } from "@/types/api";

export function CardRow({ card, deckId }: { card: Card; deckId: number }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCardAction(card.id, deckId);
      setDeleteOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-start gap-md border-b border-border px-md py-sm last:border-b-0">
        <div className="grid min-w-0 flex-1 gap-2xs sm:grid-cols-2 sm:gap-md">
          <p className="truncate text-sm font-medium text-fg">{card.front}</p>
          <p className="truncate text-sm text-fg-muted">{card.back}</p>
        </div>

        <span className="hidden shrink-0 text-2xs text-fg-subtle sm:block">
          {formatDate(card.created_at)}
        </span>

        <Dropdown
          ariaLabel={uz.common.edit}
          trigger={
            <span className="flex size-7 items-center justify-center rounded-md text-fg-subtle hover:bg-surface-hover">
              ⋯
            </span>
          }
          items={[
            { label: uz.common.edit, onSelect: () => setEditOpen(true) },
            { label: uz.common.delete, tone: "danger", onSelect: () => setDeleteOpen(true) },
          ]}
        />
      </div>

      <CardFormDialog open={editOpen} onOpenChange={setEditOpen} deckId={deckId} card={card} />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={uz.card.deleteTitle}
        description={uz.card.deleteConfirm}
        confirmLabel={uz.common.delete}
        pending={pending}
        onConfirm={handleDelete}
      />
    </>
  );
}
