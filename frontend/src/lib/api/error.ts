/**
 * One error type for both runtimes.
 *
 * The route-handler proxy re-emits the backend envelope verbatim, so client
 * code parses failures with exactly this class - no second error model.
 */

export type ApiErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "server"
  | "network"
  | "unknown";

/**
 * Derive a semantic code from the HTTP status.
 *
 * The backend's `error.code` is just the status repeated as a number, so a
 * string union is more useful - and it lets `network` (no response at all) be
 * represented in the same space.
 */
export function codeFromStatus(status: number): ApiErrorCode {
  if (status === 0) return "network";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string[]>;
  /** The backend's error.name, kept for logs. */
  readonly backendName?: string;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: Record<string, string[]>,
    backendName?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.backendName = backendName;
  }

  get isValidation() {
    return this.code === "validation";
  }
  get isUnauthorized() {
    return this.code === "unauthorized";
  }
  get isNotFound() {
    return this.code === "not_found";
  }
  get isRateLimited() {
    return this.code === "rate_limited";
  }

  /** First message for a field, if the backend reported one. */
  fieldError(field: string): string | undefined {
    return this.fields?.[field]?.[0];
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
