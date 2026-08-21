import { EmptyState } from "@/components/ui";
import { Pagination } from "@/components/ui/pagination";
import { UserRow } from "./user-row";
import { buildUserListHref, type UserFilters } from "@/lib/validation/admin";
import { uz } from "@/lib/i18n/uz";
import type { AdminUser } from "@/types/api";
import type { Pagination as PaginationMeta } from "@/lib/api/paginated";

/**
 * A bordered container of rows, matching CardList.
 *
 * Stays a server component: unlike CardList the dialogs live inside UserRow, so
 * nothing here needs client state.
 */
export function UserList({
  users,
  pagination,
  filters,
  currentUserId,
}: {
  users: AdminUser[];
  pagination: PaginationMeta;
  filters: UserFilters;
  currentUserId: number;
}) {
  if (users.length === 0) {
    return <EmptyState title={uz.admin.empty} description={uz.admin.emptyHint} />;
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="rounded-lg border border-border bg-surface">
        {users.map((user) => (
          <UserRow key={user.id} user={user} currentUserId={currentUserId} />
        ))}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        pageCount={pagination.pageCount}
        buildHref={(page) => buildUserListHref(filters, page)}
      />
    </div>
  );
}
