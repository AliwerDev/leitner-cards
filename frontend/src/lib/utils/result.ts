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
      /**
       * The submitted values, echoed back so the form can refill itself.
       *
       * useActionState re-renders on every result, which resets uncontrolled
       * inputs to empty. Without this the user retypes the whole form after a
       * single validation error. Never carries password fields.
       */
      values?: Record<string, string>;
    };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(
  message?: string,
  fields?: Record<string, string>,
  values?: Record<string, string>,
): ActionResult<never> {
  return { ok: false, message, fields, values };
}

/**
 * Pull the named fields out of a FormData for echoing back.
 *
 * Password inputs are deliberately excluded: round-tripping a password through
 * the RSC payload would put it in the browser's memory and network log for no
 * benefit, since password managers refill them anyway.
 */
export function retainValues(formData: FormData, names: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const name of names) {
    const value = formData.get(name);
    if (typeof value === "string") values[name] = value;
  }
  return values;
}
