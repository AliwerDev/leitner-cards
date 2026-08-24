import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth/session-context";
import { connectQueryToDevice, createQueryClient } from "@/lib/query/client";
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
 *   AuthProvider is inside QueryClientProvider because signing out clears the
 *     query cache, so it needs the client.
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
          <QueryClientProvider client={queryClient}>
            <AuthProvider onReady={onReady}>
              <ThemedStatusBar />
              {ready ? <RootNavigator /> : null}
            </AuthProvider>
          </QueryClientProvider>
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        {/* Full screen over the tabs: a session hides the tab bar. */}
        <Stack.Screen name="study" />
        <Stack.Screen name="(modals)" options={{ presentation: "modal", headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
