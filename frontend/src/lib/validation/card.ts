import { z } from "zod";
import { m } from "./messages";
import { MAX_CARD_SIDE_LENGTH, MAX_SEARCH_LENGTH } from "@/lib/domain/limits";

/** Mirrors backend/models/Card.php: front and back are 1..1000 characters. */
const side = z
  .string()
  .trim()
  .min(1, m.required)
  .max(MAX_CARD_SIDE_LENGTH, m.maxLength(MAX_CARD_SIDE_LENGTH));

export const cardCreateSchema = z.object({
  deckId: z.number().int().positive(),
  front: side,
  back: side,
});

export type CardCreateInput = z.infer<typeof cardCreateSchema>;

export const cardUpdateSchema = z.object({
  front: side.optional(),
  back: side.optional(),
});

export type CardUpdateInput = z.infer<typeof cardUpdateSchema>;

export const cardMoveSchema = z.object({
  deckId: z.number().int().positive(),
});

/** Matches CardController::MAX_SEARCH_LENGTH so the 422 never has to happen. */
export const cardSearchSchema = z.object({
  deckId: z.number().int().positive(),
  q: z.string().trim().max(MAX_SEARCH_LENGTH, m.maxLength(MAX_SEARCH_LENGTH)).optional(),
  page: z.number().int().positive().optional(),
});
