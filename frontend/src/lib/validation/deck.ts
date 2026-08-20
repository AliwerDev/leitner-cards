import { z } from "zod";
import { DeckDirection } from "@/types/api";
import { m } from "./messages";

/** Mirrors backend/models/Deck.php rules(). */
export const deckCreateSchema = z.object({
  name: z.string().trim().min(1, m.required).max(255, m.maxLength(255)),
  description: z.string().trim().max(2000, m.maxLength(2000)).nullish(),
  color: z.number().int().nullish(),
  direction: z
    .union([z.literal(DeckDirection.FrontToBack), z.literal(DeckDirection.BackToFront)])
    .default(DeckDirection.FrontToBack),
});

export type DeckCreateInput = z.infer<typeof deckCreateSchema>;

/** Partial: the backend's load() leaves omitted keys untouched. */
export const deckUpdateSchema = deckCreateSchema.partial();

export type DeckUpdateInput = z.infer<typeof deckUpdateSchema>;
