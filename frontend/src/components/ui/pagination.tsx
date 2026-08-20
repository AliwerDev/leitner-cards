import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type PaginationProps = {
  currentPage: number;
  pageCount: number;
  buildHref: (page: number) => string;
};

/** Link-based, so it works without JavaScript and gets history entries. */
export function Pagination({ currentPage, pageCount, buildHref }: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === pageCount || Math.abs(page - currentPage) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-3xs" aria-label="Sahifalar">
      {pages.map((page, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && page - previous > 1;

        return (
          <span key={page} className="flex items-center gap-3xs">
            {gap ? <span className="px-2xs text-fg-subtle">…</span> : null}
            <Link
              href={buildHref(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-md px-2xs text-sm transition-colors",
                page === currentPage
                  ? "bg-accent text-fg-on-accent"
                  : "text-fg-muted hover:bg-surface-hover",
              )}
            >
              {page}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
