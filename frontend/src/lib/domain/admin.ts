/**
 * Admin enum helpers that client components need.
 *
 * Kept out of lib/api/endpoints/admin.ts because that module is server-only,
 * and a client component importing it would pull the API client into the browser
 * bundle - the same reason limits.ts exists.
 */

import { UserRole, UserStatus, UserType } from "@/types/api";
import { uz } from "@/lib/i18n/uz";
import type { Tone } from "@/types/ui";

type Option = { value: number; label: string };

/**
 * Labels arrive from the API as *_label on each row; these are for controls,
 * where there is no entity behind the option to carry one.
 */
export const TYPE_OPTIONS: readonly Option[] = [
  { value: UserType.Regular, label: uz.admin.typeRegular },
  { value: UserType.Premium, label: uz.admin.typePremium },
];

export const ROLE_OPTIONS: readonly Option[] = [
  { value: UserRole.User, label: uz.admin.roleUser },
  { value: UserRole.Admin, label: uz.admin.roleAdmin },
];

/** Settable states. Deleted is reached through DELETE, never a dropdown. */
export const STATUS_OPTIONS: readonly Option[] = [
  { value: UserStatus.Active, label: uz.admin.statusActive },
  { value: UserStatus.Inactive, label: uz.admin.statusInactive },
];

/** Filterable states. Deleted is included so soft-deleted rows can be found. */
export const STATUS_FILTER_OPTIONS: readonly Option[] = [
  ...STATUS_OPTIONS,
  { value: UserStatus.Deleted, label: uz.admin.statusDeleted },
];

export function statusTone(status: UserStatus): Tone {
  if (status === UserStatus.Active) return "success";
  if (status === UserStatus.Inactive) return "warning";

  return "danger";
}

export function isBlocked(status: UserStatus): boolean {
  return status !== UserStatus.Active;
}
