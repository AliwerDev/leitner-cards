// COPIED FROM frontend/src/lib/domain/card-parse.ts
// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.

/**
 * Turns pasted text into card rows.
 *
 * One line is one card, with the two sides divided by a separator:
 *
 *   front | back
 *   front : back
 *   front<TAB>back
 *
 * Pure and free of API imports, so the bulk dialog can count rows while the
 * user types and the server action can re-parse the same text on submit.
 */

import { MAX_CARD_SIDE_LENGTH } from "./limits";
import { uz } from "@/lib/i18n/uz";

export type ParsedRow = { line: number; front: string; back: string };
export type ParseError = { line: number; text: string; reason: string };
export type ParseResult = { rows: ParsedRow[]; errors: ParseError[] };

/**
 * Separators in priority order.
 *
 * Tab comes first so a paste of two spreadsheet columns works even when the
 * cells themselves contain a pipe or a colon. Pipe outranks colon because a
 * colon is common inside ordinary text ("URL: https://...") while a pipe
 * almost never is.
 */
const SEPARATORS = ["\t", "|", ":"] as const;

/** Splits on the first occurrence of the highest-priority separator present. */
function splitLine(line: string): [string, string] | null {
  for (const separator of SEPARATORS) {
    const at = line.indexOf(separator);
    // Only the first occurrence divides the line, so a back side may keep its
    // own separators: "suv : https://example.com" survives intact.
    if (at !== -1) return [line.slice(0, at), line.slice(at + separator.length)];
  }
  return null;
}

export function parseCardLines(input: string): ParseResult {
  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  input.split(/\r\n|\r|\n/).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();

    // Blank lines separate blocks in a paste; they are not mistakes.
    if (trimmed === "") return;

    const parts = splitLine(trimmed);

    if (parts === null) {
      errors.push({ line, text: trimmed, reason: uz.card.bulkErrorNoSeparator });
      return;
    }

    const front = parts[0].trim();
    const back = parts[1].trim();

    if (front === "" || back === "") {
      errors.push({ line, text: trimmed, reason: uz.card.bulkErrorEmptySide });
      return;
    }

    if (front.length > MAX_CARD_SIDE_LENGTH || back.length > MAX_CARD_SIDE_LENGTH) {
      errors.push({
        line,
        text: trimmed,
        reason: uz.validation.maxLength(MAX_CARD_SIDE_LENGTH),
      });
      return;
    }

    rows.push({ line, front, back });
  });

  return { rows, errors };
}
