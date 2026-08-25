import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { usePendingFlush } from "@/hooks/use-pending-flush";
import { AuthProvider, useAuth } from "@/lib/auth/session-context";
import { connectQueryToDevice, createQueryClient } from "@/lib/query/client";
import { persistOptions } from "@/lib/query/persist";
import { ThemeProvider, useTheme } from "@/lib/theme/theme-context";

/**
 * Hold the splash screen until the session is resolved.
 *
 * Without this the app paints the login screen, then swaps to the tabs a
 * moment later once SecureStore comes back - a flash that reads as a bug every
 * time the app is opened.
 */
void SplashScreen.preventAutoHideAsync();

/**
 * Provider order is load-bearing:
 *   GestureHandlerRootView must be the outermost native view.
 *   ThemeProvider is above QueryClientProvider so any error UI is themed.
 *   AuthProvider is inside the query provider because signing out clears the
 *     query cache, so it needs the client.
 *
 *   PersistQueryClientProvider replaces QueryClientProvider. It does NOT gate
 *     rendering on the restore: children mount immediately and queries report
 *     isRestoring until the disk read finishes. The splash is already held by
 *     AuthProvider's onReady, which waits on SecureStore - a strictly slower
 *     read - so restoration adds nothing to first paint.
 */
export default function RootLayout() {
  const queryClient = useMemo(() => createQueryClient(), []);
  const [ready, setReady] = useState(false);

  // Connect React Query to AppState and NetInfo. Without this the cache has no
  // idea the app was backgrounded for an hour or that the network came back.
  useEffect(() => connectQueryToDevice(), []);

  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <AuthProvider onReady={onReady}>
              <ThemedStatusBar />
              {ready ? <RootNavigator /> : null}
            </AuthProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStatusBar() {
  const { resolved } = useTheme();
  // The bar content is the inverse of the background it sits on.
  return <StatusBar style={resolved === "dark" ? "light" : "dark"} />;
}

/**
 * The auth gate.
 *
 * Stack.Protected rather than a router.replace in an effect: the imperative
 * version renders the wrong screen for a frame first. When a guard flips false
 * the router also drops that stack's history, so signing out cannot leave an
 * authenticated screen reachable with the back gesture.
 *
 * `offline` counts as authenticated on purpose. A valid refresh token plus an
 * unreachable server is a working session with a network problem, and the
 * screens handle that themselves.
 */
function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? <OutboxSync /> : null}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          {/* Full screen over the tabs: a session hides the tab bar. */}
          <Stack.Screen name="study" />
          <Stack.Screen
            name="(modals)"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

/**
 * Drain the answer outbox app-wide.
 *
 * It used to mount only on the profile tab, so a user who studied offline and
 * never opened profile kept their answers on the device indefinitely. This is
 * a hook with no UI, so it lives at the root; profile still calls it for the
 * count it displays, and the module-level guard inside flushPending keeps the
 * two mounts from sending the same batch twice.
 *
 * Gated on an authenticated session so a signed-out app never fires a request
 * that can only 401.
 */
function OutboxSync() {
  usePendingFlush();

  return null;
}
