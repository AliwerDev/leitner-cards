import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "@/lib/api/endpoints/auth";
import { qk } from "@/lib/query/keys";
import { bootstrapSession } from "./bootstrap";
import { resetRefreshState, setInvalidSessionHandler } from "./refresh";
import { clearTokens, readTokens, saveTokens } from "./storage";
import type { AuthResponse, Quota, User } from "@/types/api";

/**
 * Session state for the whole app.
 *
 * `quota` lives here rather than in a query because /auth/me is its only
 * source and every "create deck" button needs it to decide whether to disable
 * itself. It must be refreshed after a deck is created or deleted - decks_used
 * and decks_remaining both move.
 */

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User; quota: Quota }
  /** Tokens are present and presumed good, but /auth/me could not be reached. */
  | { status: "offline" };

export type AuthValue = {
  state: AuthState;
  /** True for both signed-in and offline: the app should show the tabs. */
  isAuthenticated: boolean;
  user: User | null;
  quota: Quota | null;
  signIn: (login: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
  /** Re-read /auth/me. Call after anything that changes quota. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady?: () => void;
}) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const queryClient = useQueryClient();

  const clearSession = useCallback(async () => {
    resetRefreshState();
    await clearTokens();
    queryClient.clear();
    setState({ status: "signed-out" });
  }, [queryClient]);

  // Cold start: resolve the session once, then let the splash go.
  useEffect(() => {
    let active = true;

    bootstrapSession()
      .then((result) => {
        if (!active) return;
        setState(
          result.status === "signed-in"
            ? { status: "signed-in", user: result.user, quota: result.quota }
            : { status: result.status },
        );
      })
      .catch(() => {
        // bootstrapSession already swallows the expected failures; anything
        // reaching here is a bug, and stranding the user on a splash screen
        // would be the worst response to it.
        if (active) setState({ status: "signed-out" });
      })
      .finally(() => {
        if (active) onReady?.();
      });

    return () => {
      active = false;
    };
  }, [onReady]);

  /**
   * A refresh token rejected anywhere in the app ends the session. The client
   * cannot call a hook, so it reports through this handler instead.
   */
  useEffect(() => {
    setInvalidSessionHandler(() => {
      void clearSession();
    });
    return () => setInvalidSessionHandler(null);
  }, [clearSession]);

  const applyAuthResponse = useCallback(async (response: AuthResponse) => {
    await saveTokens(response);
    // The auth payload carries the user but not the quota, so read the session
    // to get both rather than showing a screen with a missing quota.
    const { user, quota } = await authApi.me();
    setState({ status: "signed-in", user, quota });
  }, []);

  const signIn = useCallback(
    async (login: string, password: string) => {
      await applyAuthResponse(await authApi.login({ login, password }));
    },
    [applyAuthResponse],
  );

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      await applyAuthResponse(await authApi.register({ username, email, password }));
    },
    [applyAuthResponse],
  );

  const signOut = useCallback(async () => {
    const stored = await readTokens();
    if (stored) {
      try {
        // Revoke just this device's session. Passing no body would end every
        // session on every device, which is a different, deliberate action.
        await authApi.logout(stored.refreshToken);
      } catch {
        // A failed revoke must not trap the user in the app. The local tokens
        // are cleared regardless; the server-side token expires on its own.
      }
    }
    await clearSession();
  }, [clearSession]);

  const signOutEverywhere = useCallback(async () => {
    try {
      await authApi.logoutEverywhere();
    } catch {
      // Same reasoning as signOut.
    }
    await clearSession();
  }, [clearSession]);

  const refresh = useCallback(async () => {
    try {
      const { user, quota } = await authApi.me();
      setState({ status: "signed-in", user, quota });
      queryClient.setQueryData(qk.session, { user, quota });
    } catch {
      // Keep whatever is on screen. A failed refresh of the session is not a
      // reason to tear down a working one.
    }
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      state,
      isAuthenticated: state.status === "signed-in" || state.status === "offline",
      user: state.status === "signed-in" ? state.user : null,
      quota: state.status === "signed-in" ? state.quota : null,
      signIn,
      signUp,
      signOut,
      signOutEverywhere,
      refresh,
    }),
    [state, signIn, signUp, signOut, signOutEverywhere, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (value === null) throw new Error("useAuth must be used inside an AuthProvider.");
  return value;
}
