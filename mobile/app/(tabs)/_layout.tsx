import { Tabs } from "expo-router";
import { ChartPie, CirclePlay, Layers, User } from "lucide-react-native";
import { useDueCount } from "@/hooks/use-due";
import { uz } from "@/lib/i18n/uz";
import { useTheme } from "@/lib/theme/theme-context";

/**
 * The tab bar.
 *
 * Same three destinations and the same icons as the web's NAV_ITEMS
 * (frontend/src/components/layout/nav-links.tsx), so the two apps navigate
 * alike. The web already renders these as a floating dock below 48rem, which
 * was effectively a specification for this screen.
 *
 * Profile is a fourth tab here rather than a menu behind the avatar: there is
 * no room for a header menu on a phone, and sign-out has to be reachable.
 */

/** Matches NAV_ICON_STROKE on the web. */
const ICON_STROKE = 1.75;
const ICON_SIZE = 22;

export default function TabsLayout() {
  const { colors, fontSize } = useTheme();
  const { data } = useDueCount();

  const due = data?.due_count ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: fontSize["2xs"] },
        tabBarBadgeStyle: {
          backgroundColor: colors.accent,
          color: colors.textOnAccent,
          fontSize: fontSize["2xs"],
        },
      }}
    >
      <Tabs.Screen
        name="decks"
        options={{
          title: uz.nav.decks,
          tabBarIcon: ({ color }) => (
            <Layers color={color} size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: uz.nav.study,
          // Undefined rather than 0: a badge reading "0" is worse than none.
          tabBarBadge: due > 0 ? due : undefined,
          tabBarIcon: ({ color }) => (
            <CirclePlay color={color} size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: uz.nav.stats,
          tabBarIcon: ({ color }) => (
            <ChartPie color={color} size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: uz.nav.profile,
          tabBarIcon: ({ color }) => (
            <User color={color} size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
    </Tabs>
  );
}
