// COPIED FROM frontend/src/lib/api/paginated.ts (minus the "server-only" import).
// Keep in sync manually. See mobile/README.md.

export type Pagination = {
  totalCount: number;
  pageCount: number;
  currentPage: number;
  perPage: number;
};

export type Paginated<T> = { items: T[]; pagination: Pagination };

/**
 * Yii puts pagination in headers rather than the body.
 *
 * These are invisible to a browser (the backend sets no
 * Access-Control-Expose-Headers), which is why every call is proxied through
 * the server rather than made directly from the client.
 */
const HEADERS = {
  totalCount: "X-Pagination-Total-Count",
  pageCount: "X-Pagination-Page-Count",
  currentPage: "X-Pagination-Current-Page",
  perPage: "X-Pagination-Per-Page",
} as const;

function readInt(response: Response, header: string, fallback: number): number {
  const raw = response.headers.get(header);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  // A missing or malformed header must degrade, not push NaN through the UI.
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readPaginationHeaders(response: Response, itemCount: number): Pagination {
  return {
    totalCount: readInt(response, HEADERS.totalCount, itemCount),
    pageCount: readInt(response, HEADERS.pageCount, 1),
    currentPage: readInt(response, HEADERS.currentPage, 1),
    perPage: readInt(response, HEADERS.perPage, itemCount || 20),
  };
}

/** The backend's query param is hyphenated, which is not a JS identifier. */
export function pageQuery(page?: number, perPage?: number): Record<string, number | undefined> {
  return { page, "per-page": perPage };
}
