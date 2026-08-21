import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { UserFilters } from "@/components/admin/user-filters";
import { UserList } from "@/components/admin/user-list";
import { PageHeader } from "@/components/layout/page-header";
import { listUsers } from "@/lib/api/endpoints/admin";
import { notFoundOnMissing } from "@/lib/api/not-found";
import { getSession } from "@/lib/auth/session";
import { parseUserFilters } from "@/lib/validation/admin";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.admin.users };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const filters = parseUserFilters(await searchParams);

  // The layout already guaranteed an admin session; this only identifies which
  // row is the operator's own, so the self-protection can disable it.
  const [session, users] = await Promise.all([
    getSession(),
    listUsers(filters).catch(notFoundOnMissing),
  ]);

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={uz.admin.users}
        subtitle={uz.admin.usersCount(users.pagination.totalCount)}
        action={<AdminTabs />}
      />

      <UserFilters filters={filters} />

      <UserList
        users={users.items}
        pagination={users.pagination}
        filters={filters}
        currentUserId={session?.user.id ?? 0}
      />
    </div>
  );
}
