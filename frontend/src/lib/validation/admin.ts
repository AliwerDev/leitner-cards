import { z } from "zod";
import { UserRole, UserStatus, UserType } from "@/types/api";
import { m } from "./messages";

/**
 * A literal union per enum, so an out-of-range number fails here rather than
 * arriving at the backend's `in range` rule as a 422.
 */
const userTypeSchema = z.union([z.literal(UserType.Regular), z.literal(UserType.Premium)]);

const userRoleSchema = z.union([z.literal(UserRole.User), z.literal(UserRole.Admin)]);

/**
 * Deleted is omitted on purpose: the UI reaches that state through DELETE, never
 * through a status dropdown. The FILTER accepts it - see parseUserFilters.
 */
const userStatusSchema = z.union([
  z.literal(UserStatus.Active),
  z.literal(UserStatus.Inactive),
]);

export const adminUserUpdateSchema = z
  .object({
    type: userTypeSchema.optional(),
    role: userRoleSchema.optional(),
    status: userStatusSchema.optional(),
  })
  // An empty PATCH is a silent no-op that would still show a success toast.
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: m.required,
  });

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

/** Mirrors AdminPasswordResetForm: 8..72, bcrypt's own ceiling. */
export const adminPasswordSchema = z.object({
  password: z.string().min(8, m.minLength(8)).max(72, m.maxLength(72)),
});

export type AdminPasswordInput = z.infer<typeof adminPasswordSchema>;

export type UserFilters = {
  q?: string;
  type?: UserType;
  role?: UserRole;
  status?: UserStatus;
  page: number;
};

/**
 * Reads the list's query string.
 *
 * Anything unrecognized becomes undefined, so a hand-edited URL degrades to "no
 * filter" instead of a 422 from the backend.
 */
export function parseUserFilters(params: {
  q?: string;
  type?: string;
  role?: string;
  status?: string;
  page?: string;
}): UserFilters {
  const asEnum = <T extends number>(raw: string | undefined, allowed: readonly T[]) => {
    if (raw === undefined || raw === "") return undefined;

    const value = Number(raw);

    return allowed.find((option) => option === value);
  };

  const page = Number(params.page);

  return {
    q: params.q?.trim() || undefined,
    type: asEnum(params.type, [UserType.Regular, UserType.Premium]),
    role: asEnum(params.role, [UserRole.User, UserRole.Admin]),
    // Deleted is filterable although it is not settable: an admin needs to find
    // soft-deleted accounts.
    status: asEnum(params.status, [UserStatus.Active, UserStatus.Inactive, UserStatus.Deleted]),
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
  };
}

/**
 * The list URL for a set of filters.
 *
 * status can legitimately be 0 (Deleted), so every check is an explicit
 * undefined comparison - a truthiness test would silently drop that filter.
 */
export function buildUserListHref(filters: UserFilters, page = filters.page): string {
  const params = new URLSearchParams();

  if (filters.q !== undefined) params.set("q", filters.q);
  if (filters.type !== undefined) params.set("type", String(filters.type));
  if (filters.role !== undefined) params.set("role", String(filters.role));
  if (filters.status !== undefined) params.set("status", String(filters.status));
  if (page > 1) params.set("page", String(page));

  const search = params.toString();

  return search ? `/admin/users?${search}` : "/admin/users";
}
