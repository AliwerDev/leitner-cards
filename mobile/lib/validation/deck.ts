// ADAPTED FROM frontend/src/lib/validation/deck.ts
//
// One difference: `description` is included. The backend accepts it and
// Deck::fields() returns it, but the web schema omits it, so the web app can
// display a description it can never edit. There is no reason for the field to
// be write-only.
//
// The backend rule is an unbounded `string`, so the 500-character cap here is a
// client-side choice - a description is a subtitle, not an essay, and an
// unbounded text box invites one.

import { z } from "zod";
import { DeckDirection } from "@/types/api";
import { m } from "./messages";

export const MAX_DECK_DESCRIPTION_LENGTH = 500;

/** Mirrors backend/models/Deck.php rules(). */
export const deckCreateSchema = z.object({
  name: z.string().trim().min(1, m.required).max(255, m.maxLength(255)),
  description: z
    .string()
    .trim()
    .max(MAX_DECK_DESCRIPTION_LENGTH, m.maxLength(MAX_DECK_DESCRIPTION_LENGTH))
    .nullish(),
  color: z.number().int().nullish(),
  direction: z
    .union([z.literal(DeckDirection.FrontToBack), z.literal(DeckDirection.BackToFront)])
    .default(DeckDirection.FrontToBack),
});

export type DeckCreateInput = z.infer<typeof deckCreateSchema>;

/** Partial: the backend's load() leaves omitted keys untouched. */
export const deckUpdateSchema = deckCreateSchema.partial();

export type DeckUpdateInput = z.infer<typeof deckUpdateSchema>;
