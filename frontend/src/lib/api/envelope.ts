/**
 * Every backend response is wrapped by a beforeSend hook in
 * backend/config/web.php, so the envelope is guaranteed on both success and
 * failure - except for nginx-generated responses (429, 502), which are HTML.
 */

export type ApiErrorBody = {
  code: number;
  name: string;
  message: string;
  /** Present only on 422. Keyed by input field name. */
  fields?: Record<string, string[]>;
};

export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiErrorBody };

export function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value;
}
