import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, Stat } from "@/components/ui";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewsTrend } from "@/components/stats/reviews-trend";
import { getAdminStats } from "@/lib/api/endpoints/admin";
import { notFoundOnMissing } from "@/lib/api/not-found";
import { formatAccuracy } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import type { AdminBucket } from "@/types/api";

export const metadata: Metadata = { title: uz.admin.dashboard };

/** One histogram, rendered as label/count rows. A chart would add nothing. */
function Breakdown({ title, buckets }: { title: string; buckets: AdminBucket[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-2xs">
          {buckets.map((bucket) => (
            <div key={bucket.value} className="flex items-baseline justify-between gap-md">
              <dt className="text-sm text-fg-muted">{bucket.label}</dt>
              <dd className="text-sm font-medium text-fg">{bucket.count}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats().catch(notFoundOnMissing);

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader title={uz.admin.dashboard} action={<AdminTabs />} />

      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={uz.admin.usersTotal} value={stats.users.total} />
        <Stat label={uz.admin.usersActive} value={stats.users.active} tone="success" />
        <Stat label={uz.admin.decksTotal} value={stats.content.decks} />
        <Stat label={uz.admin.cardsTotal} value={stats.content.cards} />
      </div>

      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={uz.admin.reviews30d} value={stats.reviews.total_30d} tone="accent" />
        <Stat
          label={uz.admin.accuracy30d}
          value={formatAccuracy(stats.reviews.accuracy_30d)}
          tone={stats.reviews.accuracy_30d === null ? "neutral" : "accent"}
        />
        <Stat label={uz.admin.activeUsers30d} value={stats.reviews.active_users_30d} />
        <Stat label={uz.admin.registered30d} value={stats.users.registered_30d} />
      </div>

      {/*
        The series carries the same shape as ReviewService::dailySeries(), so the
        component that draws a single user's trend renders the account-wide one
        with no adapter.
      */}
      <ReviewsTrend days={stats.reviews.series} />

      <div className="grid gap-md lg:grid-cols-3">
        <Breakdown title={uz.admin.byType} buckets={stats.users.by_type} />
        <Breakdown title={uz.admin.byRole} buckets={stats.users.by_role} />
        <Breakdown title={uz.admin.byStatus} buckets={stats.users.by_status} />
      </div>

      <div className="grid gap-md sm:grid-cols-3">
        <Stat label={uz.admin.cardsStarted} value={stats.content.cards_started} />
        <Stat label={uz.admin.emptyDecks} value={stats.content.empty_decks} />
      </div>
    </div>
  );
}
