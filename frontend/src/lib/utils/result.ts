/**
 * The shape every server action returns.
 *
 * A discriminated union rather than throwing, because a thrown error in a
 * server action surfaces as an opaque digest in production and cannot carry
 * field errors back to the form.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      /** Message shown above the form. */
      message?: string;
      /** Per-field messages, keyed by input name. */
      fields?: Record<string, string>;
    };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(
  message?: string,
  fields?: Record<string, string>,
): ActionResult<never> {
  return { ok: false, message, fields };
}
