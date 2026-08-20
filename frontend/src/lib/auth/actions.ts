"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as authApi from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/error";
import { apiErrorMessage, apiFieldErrors } from "@/lib/i18n/api-errors";
import { uz } from "@/lib/i18n/uz";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { actionError, retainValues, type ActionResult } from "@/lib/utils/result";
import { zodFieldErrors } from "@/lib/validation/zod-errors";
import { clearAuthCookies, writeAuthCookies, COOKIE } from "./cookies";

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Echoed back on every failure so the form does not empty itself.
  const kept = retainValues(formData, ["login"]);

  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error), kept);

  try {
    const result = await authApi.login(parsed.data);
    writeAuthCookies(await cookies(), result);
  } catch (error) {
    if (error instanceof ApiError) {
      // A failed login is 401 with no `fields`, so place it ourselves.
      if (error.isUnauthorized) {
        return actionError(undefined, { password: uz.errors.invalidCredentials }, kept);
      }
      return actionError(apiErrorMessage(error), apiFieldErrors(error), kept);
    }
    return actionError(uz.errors.unexpected, undefined, kept);
  }

  // redirect() throws, so it must sit outside the try block.
  redirect("/decks");
}

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // Passwords are deliberately not retained - see retainValues.
  const kept = retainValues(formData, ["username", "email"]);

  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });

  if (!parsed.success) return actionError(undefined, zodFieldErrors(parsed.error), kept);

  try {
    const { username, email, password } = parsed.data;
    // Register returns a token pair directly, so there is no second login trip.
    const result = await authApi.register({ username, email, password });
    writeAuthCookies(await cookies(), result);
  } catch (error) {
    if (error instanceof ApiError) {
      return actionError(
        error.isValidation ? undefined : apiErrorMessage(error),
        apiFieldErrors(error),
        kept,
      );
    }
    return actionError(uz.errors.unexpected, undefined, kept);
  }

  redirect("/decks");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(COOKIE.refresh)?.value;

  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // A failed revoke must not block the user from signing out locally.
    }
  }

  clearAuthCookies(store);
  redirect("/login");
}
