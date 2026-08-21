import "server-only";

import { apiFetch, apiFetchPaginated } from "../client";
import { pageQuery, type Paginated } from "../paginated";
import type {
  AdminPasswordResponse,
  AdminStats,
  AdminUser,
  AdminUserDetailResponse,
  AdminUserResponse,
  AdminUserStatsResponse,
  UserRole,
  UserStatus,
  UserType,
} from "@/types/api";

export type AdminUserListQuery = {
  q?: string;
  type?: UserType;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
};

/**
 * One page of users.
 *
 * Empty and undefined filters are dropped by buildUrl, so the parsed search
 * params can be passed straight through.
 */
export function listUsers(query: AdminUserListQuery = {}): Promise<Paginated<AdminUser>> {
  const { q, type, role, status, page } = query;

  return apiFetchPaginated<AdminUser>("/admin/users", {
    query: { q, type, role, status, ...pageQuery(page) },
  });
}

export function getUser(id: number): Promise<AdminUserDetailResponse> {
  return apiFetch<AdminUserDetailResponse>(`/admin/users/${id}`);
}

/**
 * Partial update.
 *
 * The backend applies only the keys present in the body, so sending just what
 * changed keeps a stale form from overwriting a field someone else edited.
 */
export function updateUser(
  id: number,
  input: { type?: UserType; role?: UserRole; status?: UserStatus },
): Promise<AdminUserResponse> {
  return apiFetch<AdminUserResponse>(`/admin/users/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function resetPassword(id: number, password: string): Promise<AdminPasswordResponse> {
  return apiFetch<AdminPasswordResponse>(`/admin/users/${id}/reset-password`, {
    method: "POST",
    body: { password, password_repeat: password },
  });
}

/** Soft delete: the backend sets the status to Deleted and revokes the sessions. */
export function deleteUser(id: number): Promise<AdminUserResponse> {
  return apiFetch<AdminUserResponse>(`/admin/users/${id}`, { method: "DELETE" });
}

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats");
}

export function getUserStats(id: number, days = 30): Promise<AdminUserStatsResponse> {
  return apiFetch<AdminUserStatsResponse>(`/admin/users/${id}/stats`, { query: { days } });
}
