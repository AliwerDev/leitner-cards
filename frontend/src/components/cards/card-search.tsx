"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MAX_SEARCH_LENGTH } from "@/lib/domain/limits";
import { uz } from "@/lib/i18n/uz";

/**
 * Keeps `q` in the URL so a search is shareable and survives a refresh, but
 * debounces the navigation so it does not fire a server round trip per
 * keystroke.
 */
export function CardSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounced = useDebouncedValue(value, 300);

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debounced === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("q", debounced);
    else params.delete("q");
    // A new search resets to the first page.
    params.delete("page");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debounced, pathname, router, searchParams]);

  const tooLong = value.length > MAX_SEARCH_LENGTH;

  return (
    <div className="flex flex-col gap-3xs">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={uz.card.searchPlaceholder}
        leadingIcon={<span aria-hidden="true">⌕</span>}
        invalid={tooLong}
        aria-label={uz.common.search}
      />
      {/* Blocked client-side so the 422 never has to happen. */}
      {tooLong ? (
        <p className="text-xs text-danger-text">{uz.validation.maxLength(MAX_SEARCH_LENGTH)}</p>
      ) : null}
    </div>
  );
}
