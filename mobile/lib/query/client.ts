import NetInfo from "@react-native-community/netinfo";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { AppState, type AppStateStatus } from "react-native";
import { ApiError } from "@/lib/api/error";

/**
 * The query client, plus the two subscriptions that make caching behave on a
 * phone rather than in a browser tab.
 *
 * React Query's defaults assume a window: it refetches on window focus and
 * assumes navigator.onLine. Neither exists here, so both signals are wired to
 * their React Native equivalents. Without this, an app resumed after an hour in
 * a pocket shows stale numbers until something happens to touch the cache.
 */

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,

        /**
         * Never retry a 4xx. A 422 or a 404 will fail identically on the
         * second attempt, and retrying a 429 pushes against the nginx auth
         * rate limit that produced it in the first place. Network and 5xx
         * failures are worth two more tries.
         */
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },

        // Focus is driven by AppState below, not by a window event.
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Connect React Query to the OS. Returns an unsubscribe function.
 *
 * Call once, from the root layout.
 */
export function connectQueryToDevice(): () => void {
  // setEventListener returns void in v5 (it returned an unsubscribe in v4), so
  // the NetInfo subscription is held here to be torn down explicitly.
  let unsubscribeNetInfo: (() => void) | undefined;

  onlineManager.setEventListener((setOnline) => {
    unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      // isInternetReachable is null while unknown; treat that as online rather
      // than blocking every request behind a probe that has not finished.
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return unsubscribeNetInfo;
  });

  const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
    focusManager.setFocused(status === "active");
  });

  return () => {
    unsubscribeNetInfo?.();
    subscription.remove();
  };
}
