import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle, Stat } from "@/components/ui";
import { UserDetailActions } from "@/components/admin/user-detail-actions";
import { PageHeader } from "@/components/layout/page-header";
import { AccuracyTrend } from "@/components/stats/accuracy-trend";
import { LevelHistogram } from "@/components/stats/level-histogram";
import { ReviewsTrend } from "@/components/stats/reviews-trend";
import { StatsStrip } from "@/components/stats/stats-strip";
import { getUser, getUserStats } from "@/lib/api/endpoints/admin";
import { notFoundOnMissing } from "@/lib/api/not-found";
import { getSession } from "@/lib/auth/session";
import { statusTone } from "@/lib/domain/admin";
import { formatDate } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.admin.users };

type PageProps = { params: Promise<{ userId: string }> };

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId: raw } = await params;
  const userId = Number(raw);

  // A non-numeric segment must 404 before it reaches the API.
  if (!Number.isInteger(userId) || userId < 1) notFound();

  const [session, detail, stats] = await Promise.all([
    getSession(),
    getUser(userId).catch(notFoundOnMissing),
    getUserStats(userId).catch(notFoundOnMissing),
  ]);

  const { user, quota, counts } = detail;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={[{ href: "/admin/users", label: uz.admin.users }]}
        title={user.username}
        subtitle={user.email}
        accessory={
          <div className="flex items-center gap-3xs">
            <Badge size="sm" tone={user.is_premium ? "accent" : "neutral"}>
              {user.type_label}
            </Badge>
            {user.is_admin ? (
              <Badge size="sm" tone="info">
                {user.role_label}
              </Badge>
            ) : null}
            <Badge size="sm" tone={statusTone(user.status)} dot>
              {user.status_label}
            </Badge>
          </div>
        }
      />

      <UserDetailActions user={user} currentUserId={session?.user.id ?? 0} />

      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={uz.admin.decksCount} value={counts.decks} />
        <Stat label={uz.admin.cardsCount} value={counts.cards} />
        <Stat label={uz.admin.reviewsCount} value={counts.reviews} />
        <Stat label={uz.admin.activeSessions} value={counts.active_sessions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{uz.admin.account}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2xs sm:grid-cols-2">
            <Row label={uz.admin.type} value={quota.type_label} />
            <Row label={uz.admin.role} value={user.role_label} />
            <Row label={uz.admin.status} value={user.status_label} />
            <Row
              label={uz.admin.decksCount}
              value={
                quota.max_decks === null
                  ? String(quota.decks_used)
                  : `${quota.decks_used} / ${quota.max_decks}`
              }
            />
            <Row label={uz.admin.createdAt} value={formatDate(user.created_at)} />
            <Row label={uz.admin.updatedAt} value={formatDate(user.updated_at)} />
          </dl>
        </CardContent>
      </Card>

      <h2 className="text-sm font-medium text-fg-muted">{uz.admin.learningStats}</h2>

      {/* The response reuses the Stats and DailyPoint shapes, so these are the
          same components the user's own /stats page renders. */}
      <StatsStrip stats={stats.stats} />
      <ReviewsTrend days={stats.days} />

      <div className="grid gap-md lg:grid-cols-[2fr_1fr]">
        <LevelHistogram buckets={stats.stats.by_level} />
        <AccuracyTrend days={stats.days} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-md border-b border-border py-2xs last:border-b-0 sm:last:border-b">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="text-sm text-fg">{value}</dd>
    </div>
  );
}
