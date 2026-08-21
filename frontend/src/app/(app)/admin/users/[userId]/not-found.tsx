import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";

/**
 * A missing user, and also a forbidden one: notFoundOnMissing() folds 403 into
 * 404 so this page cannot be used to tell an existing account from a denied one.
 */
export default function AdminUserNotFound() {
  return (
    <EmptyState
      icon="🔍"
      title={uz.admin.notFound}
      action={
        <Link href="/admin/users">
          <Button variant="outline">{uz.common.back}</Button>
        </Link>
      }
    />
  );
}
