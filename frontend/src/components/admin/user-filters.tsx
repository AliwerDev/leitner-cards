import Link from "next/link";
import { Button, Input, Select } from "@/components/ui";
import { ROLE_OPTIONS, STATUS_FILTER_OPTIONS, TYPE_OPTIONS } from "@/lib/domain/admin";
import { MAX_SEARCH_LENGTH } from "@/lib/domain/limits";
import { uz } from "@/lib/i18n/uz";
import type { UserFilters } from "@/lib/validation/admin";

/**
 * A plain GET form, not a debounced client control.
 *
 * CardSearch debounces because a deck search is one input and a continuous
 * browsing gesture. This composes four controls, so an explicit submit is both
 * simpler and better: one navigation instead of four. Being a real
 * <form method="get"> it needs no client component, no useSearchParams and no
 * router, and the browser builds the query string itself.
 *
 * There is no `page` input, so submitting drops it and the results reset to page
 * one - which is what a changed filter should do.
 */
export function UserFilters({ filters }: { filters: UserFilters }) {
  // "Barchasi" is a real option rather than Select's placeholder, which renders
  // a disabled option and could not be chosen to clear the filter.
  const all = { value: "", label: uz.admin.filterAll };

  return (
    <form method="get" action="/admin/users" className="flex flex-wrap items-end gap-sm">
      <div className="min-w-52 flex-1">
        <Input
          name="q"
          defaultValue={filters.q ?? ""}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder={uz.admin.searchPlaceholder}
          aria-label={uz.admin.searchPlaceholder}
        />
      </div>

      <Select
        name="type"
        defaultValue={filters.type ?? ""}
        options={[all, ...TYPE_OPTIONS]}
        aria-label={uz.admin.filterType}
        className="w-36"
      />
      <Select
        name="role"
        defaultValue={filters.role ?? ""}
        options={[all, ...ROLE_OPTIONS]}
        aria-label={uz.admin.filterRole}
        className="w-36"
      />
      <Select
        name="status"
        // status can be 0, so the fallback tests for undefined explicitly.
        defaultValue={filters.status === undefined ? "" : filters.status}
        options={[all, ...STATUS_FILTER_OPTIONS]}
        aria-label={uz.admin.filterStatus}
        className="w-36"
      />

      <Button type="submit" variant="secondary">
        {uz.admin.filterApply}
      </Button>
      <Link href="/admin/users">
        <Button type="button" variant="ghost">
          {uz.admin.filterReset}
        </Button>
      </Link>
    </form>
  );
}
