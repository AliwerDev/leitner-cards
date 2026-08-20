import type { ZodError } from "zod";

/**
 * Flatten a ZodError into the one-message-per-field shape that Field expects.
 *
 * Only the first issue per field is kept: a form shows one message under a
 * control, and the rest are noise.
 */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}
