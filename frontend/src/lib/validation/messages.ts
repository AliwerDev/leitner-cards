import { uz } from "@/lib/i18n/uz";

/** Uzbek zod messages, in one place so wording cannot drift between schemas. */
export const m = {
  required: uz.validation.required,
  email: uz.validation.email,
  minLength: (n: number) => uz.validation.minLength(n),
  maxLength: (n: number) => uz.validation.maxLength(n),
  usernamePattern: uz.validation.usernamePattern,
  passwordMismatch: uz.validation.passwordMismatch,
} as const;
