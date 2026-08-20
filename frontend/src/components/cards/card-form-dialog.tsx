"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Textarea,
} from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { createCardAction, updateCardAction } from "@/lib/actions/cards";
import { MAX_CARD_SIDE_LENGTH } from "@/lib/domain/limits";
import { uz } from "@/lib/i18n/uz";
import type { Card } from "@/types/api";
import type { ActionResult } from "@/lib/utils/result";

export function CardFormDialog({
  open,
  onOpenChange,
  deckId,
  card,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: number;
  card?: Card;
}) {
  const router = useRouter();
  const isEdit = card !== undefined;

  const action = isEdit
    ? updateCardAction.bind(null, card.id, deckId)
    : createCardAction.bind(null, deckId);

  const [state, formAction] = useActionState<ActionResult<Card> | null, FormData>(action, null);

  useEffect(() => {
    if (state?.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const fields = state?.ok === false ? (state.fields ?? {}) : {};
  const message = state?.ok === false ? state.message : undefined;
  // Refill after a failed submit; a re-render would blank the textareas.
  const values = state?.ok === false ? (state.values ?? {}) : {};

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={isEdit ? uz.card.edit : uz.card.create}
    >
      <DialogHeader>
        <DialogTitle>{isEdit ? uz.card.edit : uz.card.create}</DialogTitle>
      </DialogHeader>

      <form action={formAction}>
        <DialogBody>
          {message ? <Alert tone="danger" title={message} /> : null}

          <Field label={uz.card.front} error={fields.front} required>
            <Textarea
              name="front"
              rows={3}
              maxLength={MAX_CARD_SIDE_LENGTH}
              showCount
              defaultValue={values.front ?? card?.front}
              autoFocus
            />
          </Field>

          <Field label={uz.card.back} error={fields.back} required>
            <Textarea
              name="back"
              rows={3}
              maxLength={MAX_CARD_SIDE_LENGTH}
              showCount
              defaultValue={values.back ?? card?.back}
            />
          </Field>
        </DialogBody>

        <DialogFooter className="mt-md">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {uz.common.cancel}
          </Button>
          <SubmitButton>{uz.common.save}</SubmitButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
