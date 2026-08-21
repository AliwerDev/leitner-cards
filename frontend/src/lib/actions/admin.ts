"use server";

import { revalidatePath } from "next/cache";
import * as adminApi from "@/lib/api/endpoints/admin";
import { ApiError } from "@/lib/api/error";
import { getSession } from "@/lib/auth/session";
import { apiErrorMessage, apiFieldErrors } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { adminPasswordSchema, adminUserUpdateSchema } from "@/lib/validation/admin";
import { actionError, actionOk, type ActionResult } from "@/lib/utils/result";
import { zodFieldErrors } from "@/lib/validation/zod-errors";
import type { AdminUser } from "@/types/api";

/**
 * A forbidden response is reported as the generic message.
 *
 * Inside the admin surface a "you are not allowed" string would confirm the
 * endpoint exists, which is what the whole 404 strategy avoids.
 */
function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ApiError) {
    if (error.isForbidden) return actionError(uz.errors.unexpected);

    return actionError(
      error.isValidation ? undefined : apiErrorMessage(error),
      apiFieldErrors(error),
    );
  }

  return actionError(uz.errors.unexpected);
}

/**
 * Every admin action re-checks the role.
 *
 * A server action is a public POST endpoint: the middleware and layout gates
 * guard the page, not the action. The backend 403s anyway, but failing here
 * keeps the response generic instead of an admin-existence oracle.
 */
async function isAdmin(): Promise<boolean> {
  const session = await getSession();

  return session?.user.is_admin === true;
}

function revalidateUser(userId: number): void {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  // Type and status changes move the dashboard aggregates.
  revalidatePath("/admin");
}

export async function updateUserAction(
  userId: number,
  _prev: ActionResult<AdminUser> | null,
  formData: FormData,
): Promise<ActionResult<AdminUser>> {
  if (!(await isAdmin())) return actionError(uz.errors.unexpected);

  // A disabled <select> submits nothing, and an absent key must stay absent so
  // the PATCH remains partial.
  const optionalNumber = (name: string) => {
    const raw = formData.get(name);

    return raw === null || raw === "" ? undefined : Number(raw);
  };

  const parsed = adminUserUpdateSchema.safeParse({
    type: optionalNumber("type"),
    role: optionalNumber("role"),
    status: optionalNumber("status"),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error));

  try {
    const { user } = await adminApi.updateUser(userId, parsed.data);
    revalidateUser(userId);

    return actionOk(user);
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPasswordAction(
  userId: number,
  _prev: ActionResult<string> | null,
  formData: FormData,
): Promise<ActionResult<string>> {
  if (!(await isAdmin())) return actionError(uz.errors.unexpected);

  // No retainValues: a password must not round-trip through the RSC payload.
  const parsed = adminPasswordSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error));

  try {
    const { message } = await adminApi.resetPassword(userId, parsed.data.password);

    // Nothing rendered changes, so no revalidate.
    return actionOk(message);
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteUserAction(userId: number): Promise<ActionResult> {
  if (!(await isAdmin())) return actionError(uz.errors.unexpected);

  try {
    await adminApi.deleteUser(userId);
    revalidateUser(userId);

    return actionOk(undefined);
  } catch (error) {
    return toActionError(error);
  }
}
