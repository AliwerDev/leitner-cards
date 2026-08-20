import { z } from "zod";
import { m } from "./messages";
import { uz } from "@/lib/i18n/uz";
import { MAX_BULK_ROWS, MAX_CARD_SIDE_LENGTH, MAX_SEARCH_LENGTH } from "@/lib/domain/limits";

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

/** Mirrors CardBulkForm: 1..MAX_BULK_ROWS rows, each one a full card. */
export const cardBulkSchema = z.object({
  deckId: z.number().int().positive(),
  cards: z
    .array(z.object({ front: side, back: side }))
    .min(1, uz.card.bulkEmpty)
    .max(MAX_BULK_ROWS, uz.card.bulkTooMany(MAX_BULK_ROWS)),
});

export type CardBulkInput = z.infer<typeof cardBulkSchema>;

export const cardMoveSchema = z.object({
  deckId: z.number().int().positive(),
});

/** Matches CardController::MAX_SEARCH_LENGTH so the 422 never has to happen. */
export const cardSearchSchema = z.object({
  deckId: z.number().int().positive(),
  q: z.string().trim().max(MAX_SEARCH_LENGTH, m.maxLength(MAX_SEARCH_LENGTH)).optional(),
  page: z.number().int().positive().optional(),
});
