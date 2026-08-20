import type { Metadata } from "next";
import { Badge, Card, CardHeader, CardTitle, Progress, Separator } from "@/components/ui";
import { LogoutButton } from "@/components/profile/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { requireSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/domain/format";
import { decksLabel, usageTone } from "@/lib/domain/quota";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.profile.title };

export default async function ProfilePage() {
  // Already fetched by the layout; React.cache dedupes this call.
  const { user, quota } = await requireSession();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-lg">
      <h1 className="text-2xl">{uz.profile.title}</h1>

      <Card variant="outlined">
        <CardHeader>
          <CardTitle>{uz.profile.account}</CardTitle>
        </CardHeader>

        <div className="mt-md flex flex-col gap-sm">
          <Row label={uz.auth.username} value={user.username} />
          <Separator />
          <Row label={uz.auth.email} value={user.email} />
          <Separator />
          <Row
            label={uz.profile.tier}
            value={<Badge tone={user.is_premium ? "accent" : "neutral"}>{user.type_label}</Badge>}
          />
          <Separator />
          <Row label={uz.profile.memberSince} value={formatDate(user.created_at)} />
        </div>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <CardTitle>{uz.profile.quota}</CardTitle>
        </CardHeader>

        <div className="mt-md flex flex-col gap-md">
          <div className="flex flex-col gap-2xs">
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-muted">{uz.profile.decksUsed}</span>
              <span className="tabular-nums text-fg">{decksLabel(quota)}</span>
            </div>
            {quota.max_decks !== null ? (
              <Progress
                value={quota.decks_used}
                max={quota.max_decks}
                tone={usageTone(quota.decks_used, quota.max_decks)}
                label={decksLabel(quota)}
              />
            ) : null}
          </div>

          <Row
            label={uz.profile.cardsPerDeck}
            value={quota.max_cards_per_deck ?? uz.common.unlimited}
          />

          {/* Tier changes are a manual DB update, so there is no upgrade
              button to offer. */}
          {!user.is_premium ? (
            <p className="text-xs text-fg-subtle">{uz.profile.upgradeHint}</p>
          ) : null}
        </div>
      </Card>

      <Card variant="outlined">
        <div className="flex items-center justify-between gap-md">
          <span className="text-sm text-fg-muted">{uz.nav.theme}</span>
          <ThemeToggle />
        </div>
      </Card>

      <LogoutButton />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-md text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="text-fg">{value}</span>
    </div>
  );
}
