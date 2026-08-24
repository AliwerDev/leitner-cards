import { useCallback, useState } from "react";
import type { z } from "zod";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage, apiFieldErrors, isQuotaError } from "@/lib/i18n/api-errors";

/**
 * Local validation, then the request, then the server's field errors - the
 * same sequence on every form in the app.
 *
 * The web gets this from server actions returning ActionResult, where the
 * action does the zod parse and hands back `{ fields, values }`. There are no
 * server actions here, so the sequence lives in a hook instead. The shape of
 * what it produces is deliberately the same: a message for the form and a map
 * of messages for the fields.
 *
 * Two backend behaviours it papers over:
 *
 *   Login failure is a 401 with no `fields`, not a 422, so a caller can map it
 *   onto a field itself via `fieldOnUnauthorized`.
 *
 *   Quota rejections are 422s keyed on a surrogate field (a deck limit lands on
 *   `name`), but they are about the account, not the input. They are lifted to
 *   the form-level message so they do not read as "your deck name is wrong".
 */

export type FormErrors = Record<string, string>;

export type UseFormResult<TInput> = {
  submit: (values: TInput) => Promise<boolean>;
  submitting: boolean;
  /** Form-level message: a network failure, a quota limit, a 500. */
  message: string | null;
  fields: FormErrors;
  reset: () => void;
};

export type UseFormOptions<TSchema extends z.ZodTypeAny, TResult> = {
  schema: TSchema;
  onSubmit: (values: z.infer<TSchema>) => Promise<TResult>;
  onSuccess?: (result: TResult) => void;
  /** Map a 401 onto this field, for login where the API sends no field errors. */
  fieldOnUnauthorized?: string;
};

export function useForm<TSchema extends z.ZodTypeAny, TResult>({
  schema,
  onSubmit,
  onSuccess,
  fieldOnUnauthorized,
}: UseFormOptions<TSchema, TResult>): UseFormResult<z.infer<TSchema>> {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<FormErrors>({});

  const reset = useCallback(() => {
    setMessage(null);
    setFields({});
  }, []);

  const submit = useCallback(
    async (values: z.infer<TSchema>): Promise<boolean> => {
      setMessage(null);
      setFields({});

      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        const next: FormErrors = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          // Only the first message per field is shown; the rest would stack up
          // under one input with no room for them.
          if (typeof key === "string" && !(key in next)) next[key] = issue.message;
        }
        setFields(next);
        return false;
      }

      setSubmitting(true);
      try {
        const result = await onSubmit(parsed.data);
        onSuccess?.(result);
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          if (isQuotaError(error)) {
            // An account limit, not a bad input. Surface it above the form.
            setMessage(Object.values(error.fields ?? {}).flat()[0] ?? apiErrorMessage(error));
            return false;
          }

          if (error.isUnauthorized && fieldOnUnauthorized) {
            setFields({ [fieldOnUnauthorized]: apiErrorMessage(error) });
            return false;
          }

          const fieldErrors = apiFieldErrors(error);
          if (Object.keys(fieldErrors).length > 0) {
            setFields(fieldErrors);
          } else {
            setMessage(apiErrorMessage(error));
          }
          return false;
        }

        // Not an ApiError: a bug rather than a rejected request. Say something
        // rather than leaving the button spinning.
        setMessage(String(error));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [schema, onSubmit, onSuccess, fieldOnUnauthorized],
  );

  return { submit, submitting, message, fields, reset };
}
