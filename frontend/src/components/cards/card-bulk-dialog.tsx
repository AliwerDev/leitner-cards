"use client";

import { useActionState, useEffect, useState } from "react";
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
  useToast,
} from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { createCardsAction } from "@/lib/actions/cards";
import { parseCardLines } from "@/lib/domain/card-parse";
import { uz } from "@/lib/i18n/uz";
import type { ActionResult } from "@/lib/utils/result";

type BulkResult = ActionResult<{ created: number }> | null;

export function CardBulkDialog({
  open,
  onOpenChange,
  deckId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: number;
}) {
  const router = useRouter();
  const toast = useToast();

  const [state, formAction] = useActionState<BulkResult, FormData>(
    createCardsAction.bind(null, deckId),
    null,
  );

  // Only the counts are held in state; the textarea stays uncontrolled so the
  // retention path below can refill it through defaultValue.
  const [counts, setCounts] = useState({ rows: 0, errors: 0 });

  useEffect(() => {
    if (state?.ok) {
      toast({ title: uz.card.bulkSuccess(state.data.created), tone: "success" });
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router, toast]);

  const fields = state?.ok === false ? (state.fields ?? {}) : {};
  const message = state?.ok === false ? state.message : undefined;
  // Refill after a failed submit; a re-render would blank the textarea.
  const values = state?.ok === false ? (state.values ?? {}) : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange} ariaLabel={uz.card.bulkTitle} size="lg">
      <DialogHeader>
        <DialogTitle>{uz.card.bulkTitle}</DialogTitle>
      </DialogHeader>

      <form action={formAction}>
        <DialogBody>
          {message ? <Alert tone="danger" title={message} /> : null}

          <Field label={uz.card.bulkLabel} error={fields.rows} hint={uz.card.bulkHint} required>
            <Textarea
              name="rows"
              rows={12}
              placeholder={uz.card.bulkPlaceholder}
              defaultValue={values.rows}
              onChange={(event) => {
                const { rows, errors } = parseCardLines(event.target.value);
                setCounts({ rows: rows.length, errors: errors.length });
              }}
              autoFocus
            />
          </Field>

          <p className="text-xs text-fg-subtle" aria-live="polite">
            {uz.card.bulkReady(counts.rows)}
            {counts.errors > 0 ? ` - ${uz.card.bulkInvalid(counts.errors)}` : null}
          </p>
        </DialogBody>

        <DialogFooter className="mt-md">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {uz.common.cancel}
          </Button>
          <SubmitButton disabled={counts.rows === 0}>{uz.common.save}</SubmitButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
