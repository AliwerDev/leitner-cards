"use server";

import { revalidatePath } from "next/cache";
import * as cardsApi from "@/lib/api/endpoints/cards";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage, apiFieldErrors, isQuotaError } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { cardBulkSchema, cardCreateSchema, cardUpdateSchema } from "@/lib/validation/card";
import { parseCardLines } from "@/lib/domain/card-parse";
import { actionError, actionOk, retainValues, type ActionResult } from "@/lib/utils/result";
import { zodFieldErrors } from "@/lib/validation/zod-errors";
import type { Card } from "@/types/api";


function toActionError(
  error: unknown,
  kept?: Record<string, string>,
): ActionResult<never> {
  if (error instanceof ApiError) {
    if (isQuotaError(error)) {
      const messages = Object.values(error.fields ?? {}).flat();
      return actionError(messages[0] ?? apiErrorMessage(error), undefined, kept);
    }
    return actionError(
      error.isValidation ? undefined : apiErrorMessage(error),
      apiFieldErrors(error),
      kept,
    );
  }
  return actionError(uz.errors.unexpected, undefined, kept);
}

export async function createCardAction(
  deckId: number,
  _prev: ActionResult<Card> | null,
  formData: FormData,
): Promise<ActionResult<Card>> {
  const kept = retainValues(formData, ["front", "back"]);
  const parsed = cardCreateSchema.safeParse({
    deckId,
    front: formData.get("front"),
    back: formData.get("back"),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error), kept);

  try {
    const card = await cardsApi.createCard(parsed.data);
    revalidatePath(`/decks/${deckId}`);
    return actionOk(card);
  } catch (error) {
    return toActionError(error, kept);
  }
}

/**
 * Create every card in a pasted block.
 *
 * Bad lines stop the whole submit before any request goes out. Fixing three
 * typos is easier than working out which of forty lines silently vanished.
 */
export async function createCardsAction(
  deckId: number,
  _prev: ActionResult<{ created: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ created: number }>> {
  const kept = retainValues(formData, ["rows"]);
  const { rows, errors } = parseCardLines(String(formData.get("rows") ?? ""));

  if (errors.length > 0) {
    const lines = errors.map((error) => error.line).join(", ");
    return actionError(undefined, { rows: uz.card.bulkLineErrors(lines) }, kept);
  }

  if (rows.length === 0) {
    return actionError(undefined, { rows: uz.card.bulkEmpty }, kept);
  }

  const parsed = cardBulkSchema.safeParse({
    deckId,
    cards: rows.map(({ front, back }) => ({ front, back })),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error), kept);

  try {
    const { created } = await cardsApi.createCards(parsed.data);
    revalidatePath(`/decks/${deckId}`);
    return actionOk({ created });
  } catch (error) {
    return toActionError(error, kept);
  }
}

export async function updateCardAction(
  cardId: number,
  deckId: number,
  _prev: ActionResult<Card> | null,
  formData: FormData,
): Promise<ActionResult<Card>> {
  const kept = retainValues(formData, ["front", "back"]);
  const parsed = cardUpdateSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error), kept);

  try {
    const card = await cardsApi.updateCard(cardId, parsed.data);
    revalidatePath(`/decks/${deckId}`);
    return actionOk(card);
  } catch (error) {
    return toActionError(error, kept);
  }
}

export async function deleteCardAction(cardId: number, deckId: number): Promise<ActionResult> {
  try {
    await cardsApi.deleteCard(cardId);
    revalidatePath(`/decks/${deckId}`);
    return actionOk(undefined);
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveCardAction(
  cardId: number,
  fromDeckId: number,
  toDeckId: number,
): Promise<ActionResult> {
  try {
    await cardsApi.moveCard(cardId, toDeckId);
    revalidatePath(`/decks/${fromDeckId}`);
    revalidatePath(`/decks/${toDeckId}`);
    return actionOk(undefined);
  } catch (error) {
    return toActionError(error);
  }
}
