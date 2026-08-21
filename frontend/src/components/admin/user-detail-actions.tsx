"use client";

import { useRouter } from "next/navigation";
import { UserRow } from "./user-row";
import type { AdminUser } from "@/types/api";

/**
 * The detail page's action strip.
 *
 * Reuses UserRow rather than duplicating four dialogs and their state. The only
 * difference on this page is where a delete lands: the row it was triggered from
 * no longer belongs in a list, so it navigates back instead of refreshing into a
 * page whose subject is now soft-deleted.
 */
export function UserDetailActions({
  user,
  currentUserId,
}: {
  user: AdminUser;
  currentUserId: number;
}) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-surface">
      <UserRow
        user={user}
        currentUserId={currentUserId}
        onDeleted={() => router.push("/admin/users")}
      />
    </div>
  );
}
