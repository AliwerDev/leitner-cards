import { Monitor, Moon, Sun } from "lucide-react-native";
import { useState } from "react";
import { Alert as RNAlert, RefreshControl, ScrollView, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Card, Text } from "@/components/ui";
import { usePendingFlush } from "@/hooks/use-pending-flush";
import { useAuth } from "@/lib/auth/session-context";
import { formatDate } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import type { Theme } from "@/types/ui";

/** Matches NAV_ICON_STROKE on the web. */
const ICON_STROKE = 1.75;
const ICON_SIZE = 16;

type ThemeIcon = typeof Sun;

const THEME_OPTIONS: { value: Theme; label: string; Icon: ThemeIcon }[] = [
  { value: "light", label: uz.mobile.themeLight, Icon: Sun },
  { value: "dark", label: uz.mobile.themeDark, Icon: Moon },
  { value: "system", label: uz.mobile.themeSystem, Icon: Monitor },
];

export default function ProfileTab() {
  const { colors, preference, setPreference, space } = useTheme();
  const { user, quota, state, signOut, signOutEverywhere, refresh } = useAuth();
  const pending = usePendingFlush();

  const [refreshing, setRefreshing] = useState(false);

  /**
   * A pull re-reads the session and the outbox.
   *
   * The account and the quota come from /auth/me, which is not a query, so
   * the auth context has to be asked directly. The outbox count is local
   * storage and cannot go stale on its own, but a user pulling here has
   * usually just come back online and wants both numbers checked.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), pending.refreshCount()]);
    } finally {
      setRefreshing(false);
    }
  };

  const confirmSignOutEverywhere = () => {
    RNAlert.alert(uz.mobile.logoutEverywhere, uz.mobile.logoutEverywhereConfirm, [
      { text: uz.common.cancel, style: "cancel" },
      {
        text: uz.mobile.logoutEverywhere,
        style: "destructive",
        onPress: () => void signOutEverywhere(),
      },
    ]);
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: space.md, gap: space.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <Text variant="title">{uz.profile.title}</Text>

        {state.status === "offline" ? (
          <Alert tone="warning" title={uz.mobile.offline} message={uz.mobile.offlineBody} />
        ) : null}

        {pending.count > 0 ? (
          <Alert
            tone="warning"
            title={uz.mobile.pendingTitle}
            message={uz.mobile.pendingBody(pending.count)}
            action={
              <View style={{ marginTop: space["2xs"], alignSelf: "flex-start" }}>
                <Button
                  label={pending.flushing ? uz.mobile.pendingSending : uz.study.resendAnswers}
                  size="sm"
                  variant="outline"
                  loading={pending.flushing}
                  onPress={() => void pending.flush()}
                />
              </View>
            }
          />
        ) : null}

        {user ? (
          <Card>
            <View style={{ gap: space.sm }}>
              <Text variant="heading">{uz.profile.account}</Text>
              <Row label={uz.auth.username} value={user.username} />
              <Row label={uz.auth.email} value={user.email} />
              <Row label={uz.profile.tier} value={user.type_label} />
              <Row label={uz.profile.memberSince} value={formatDate(user.created_at)} />
            </View>
          </Card>
        ) : null}

        {quota ? (
          <Card>
            <View style={{ gap: space.sm }}>
              <Text variant="heading">{uz.profile.quota}</Text>
              <Row
                label={uz.profile.decksUsed}
                value={
                  quota.max_decks === null
                    ? uz.common.unlimited
                    : `${quota.decks_used} ${uz.common.of} ${quota.max_decks}`
                }
              />
              <Row
                label={uz.profile.cardsPerDeck}
                value={
                  quota.max_cards_per_deck === null
                    ? uz.common.unlimited
                    : String(quota.max_cards_per_deck)
                }
              />
              {!quota.is_unlimited ? (
                <Text variant="caption" tone="subtle">
                  {uz.profile.upgradeHint}
                </Text>
              ) : null}
            </View>
          </Card>
        ) : null}

        <Card>
          <View style={{ gap: space.sm }}>
            <Text variant="heading">{uz.mobile.theme}</Text>
            <View style={{ flexDirection: "row", gap: space.xs }}>
              {THEME_OPTIONS.map(({ value, label, Icon }) => {
                const selected = preference === value;
                return (
                  <View key={value} style={{ flex: 1 }}>
                    <Button
                      label={label}
                      icon={
                        <Icon
                          color={selected ? colors.textOnAccent : colors.text}
                          size={ICON_SIZE}
                          strokeWidth={ICON_STROKE}
                        />
                      }
                      size="sm"
                      block
                      variant={selected ? "primary" : "outline"}
                      onPress={() => setPreference(value)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </Card>

        <View style={{ gap: space.xs }}>
          <Button label={uz.nav.logout} variant="outline" block onPress={() => void signOut()} />
          <Button
            label={uz.mobile.logoutEverywhere}
            variant="ghost"
            block
            onPress={confirmSignOutEverywhere}
            style={{ borderColor: colors.border }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text variant="body" tone="muted">
        {label}
      </Text>
      <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}
