import { Alert as RNAlert, ScrollView, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Alert, Button, Card, Text } from "@/components/ui";
import { usePendingFlush } from "@/hooks/use-pending-flush";
import { useAuth } from "@/lib/auth/session-context";
import { formatDate } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";
import type { Theme } from "@/types/ui";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: uz.mobile.themeLight },
  { value: "dark", label: uz.mobile.themeDark },
  { value: "system", label: uz.mobile.themeSystem },
];

export default function ProfileTab() {
  const { colors, preference, setPreference, space } = useTheme();
  const { user, quota, state, signOut, signOutEverywhere } = useAuth();
  const pending = usePendingFlush();

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
      <ScrollView contentContainerStyle={{ padding: space.md, gap: space.md }}>
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
              {THEME_OPTIONS.map((option) => (
                <View key={option.value} style={{ flex: 1 }}>
                  <Button
                    label={option.label}
                    size="sm"
                    block
                    variant={preference === option.value ? "primary" : "outline"}
                    onPress={() => setPreference(option.value)}
                  />
                </View>
              ))}
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
