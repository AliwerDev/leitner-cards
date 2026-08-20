"use server";

import { revalidatePath } from "next/cache";
import * as decksApi from "@/lib/api/endpoints/decks";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage, apiFieldErrors, isQuotaError } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { deckCreateSchema, deckUpdateSchema } from "@/lib/validation/deck";
import { actionError, actionOk, type ActionResult } from "@/lib/utils/result";
import { zodFieldErrors } from "@/lib/validation/zod-errors";
import type { Deck } from "@/types/api";


/**
 * Quota failures arrive as 422 on `name`, but they describe the account rather
 * than the field, so lift them to a form-level message.
 */
function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ApiError) {
    if (isQuotaError(error)) {
      const messages = Object.values(error.fields ?? {}).flat();
      return actionError(messages[0] ?? apiErrorMessage(error));
    }
    return actionError(
      error.isValidation ? undefined : apiErrorMessage(error),
      apiFieldErrors(error),
    );
  }
  return actionError(uz.errors.unexpected);
}

export async function createDeckAction(
  _prev: ActionResult<Deck> | null,
  formData: FormData,
): Promise<ActionResult<Deck>> {
  const colorRaw = formData.get("color");
  const parsed = deckCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    color: colorRaw === null || colorRaw === "" ? null : Number(colorRaw),
    direction: Number(formData.get("direction") ?? 1),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error));

  try {
    const deck = await decksApi.createDeck(parsed.data);
    revalidatePath("/decks");
    return actionOk(deck);
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateDeckAction(
  deckId: number,
  _prev: ActionResult<Deck> | null,
  formData: FormData,
): Promise<ActionResult<Deck>> {
  const colorRaw = formData.get("color");
  const parsed = deckUpdateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    color: colorRaw === null || colorRaw === "" ? null : Number(colorRaw),
    direction: Number(formData.get("direction") ?? 1),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error));

  try {
    const deck = await decksApi.updateDeck(deckId, parsed.data);
    revalidatePath("/decks");
    revalidatePath(`/decks/${deckId}`);
    return actionOk(deck);
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteDeckAction(deckId: number): Promise<ActionResult> {
  try {
    await decksApi.deleteDeck(deckId);
    revalidatePath("/decks");
    return actionOk(undefined);
  } catch (error) {
    return toActionError(error);
  }
}
