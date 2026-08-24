import { Redirect } from "expo-router";

/**
 * The Study tab is a shortcut, not a screen.
 *
 * Tapping the tab is intercepted in app/(tabs)/_layout.tsx, which pushes the
 * full-screen /study route instead - a session needs the whole screen, and the
 * tab bar is a distraction mid-session.
 *
 * This file still has to exist for the tab to be a route at all, and it
 * redirects to cover the paths the listener does not catch: a deep link
 * straight to /(tabs)/study, or a state restore that lands here.
 */
export default function StudyTab() {
  return <Redirect href="/study" />;
}
