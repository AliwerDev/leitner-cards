// COPIED FROM frontend/src/lib/api/endpoints/auth.ts (minus the "server-only" import).
// Keep in sync manually. See mobile/README.md.

import { apiFetch } from "../client";
import type { AuthResponse, HealthResponse, MessageResponse, SessionResponse } from "@/types/api";

export function login(input: { login: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function register(input: { username: string; email: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
}

/**
 * Always pass the current refresh token.
 *
 * With no body the backend calls revokeAllForUser() and signs the account out
 * on every device.
 */
export function logout(refreshToken: string) {
  return apiFetch<MessageResponse>("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

/**
 * MOBILE ADDITION. End every session on every device.
 *
 * Sending no body is what triggers revokeAllForUser() on the backend. The web
 * has no screen for this; on a phone it is the thing you reach for when a
 * device is lost, so it is surfaced in the profile screen.
 */
export function logoutEverywhere() {
  return apiFetch<MessageResponse>("/auth/logout", { method: "POST" });
}

export function me() {
  return apiFetch<SessionResponse>("/auth/me");
}

export function health() {
  return apiFetch<HealthResponse>("/health", { auth: false });
}
