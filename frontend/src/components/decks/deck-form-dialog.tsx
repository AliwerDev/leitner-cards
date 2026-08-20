"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
  Button,
} from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { DeckColorPicker } from "./deck-color-picker";
import { createDeckAction, updateDeckAction } from "@/lib/actions/decks";
import { DIRECTION_OPTIONS } from "@/lib/domain/direction";
import { normalizeDirection } from "@/lib/domain/direction";
import { MAX_DECK_NAME_LENGTH } from "@/lib/domain/limits";
import { uz } from "@/lib/i18n/uz";
import type { Deck } from "@/types/api";
import type { ActionResult } from "@/lib/utils/result";

export function DeckFormDialog({
  open,
  onOpenChange,
  deck,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when creating. */
  deck?: Deck;
}) {
  const router = useRouter();
  const isEdit = deck !== undefined;

  const action = isEdit ? updateDeckAction.bind(null, deck.id) : createDeckAction;
  const [state, formAction] = useActionState<ActionResult<Deck> | null, FormData>(action, null);

  useEffect(() => {
    if (state?.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const fields = state?.ok === false ? (state.fields ?? {}) : {};
  const message = state?.ok === false ? state.message : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} ariaLabel={isEdit ? uz.deck.edit : uz.deck.create}>
      <DialogHeader>
        <DialogTitle>{isEdit ? uz.deck.edit : uz.deck.create}</DialogTitle>
      </DialogHeader>

      <form action={formAction}>
        <DialogBody>
          {message ? <Alert tone="danger" title={message} /> : null}

          <Field label={uz.deck.name} error={fields.name} required>
            <Input name="name" defaultValue={deck?.name} autoFocus maxLength={MAX_DECK_NAME_LENGTH} />
          </Field>

          <Field label={uz.deck.description} error={fields.description}>
            <Textarea name="description" rows={3} defaultValue={deck?.description ?? ""} />
          </Field>

          <Field label={uz.deck.direction} error={fields.direction} hint={uz.deck.directionHint}>
            <Select
              name="direction"
              defaultValue={normalizeDirection(deck?.direction)}
              options={DIRECTION_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </Field>

          <DeckColorPicker name="color" defaultValue={deck?.color} />
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
