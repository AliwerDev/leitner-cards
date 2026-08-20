import { z } from "zod";
import { m } from "./messages";

/** Mirrors backend/modules/api/v1/models/RegisterForm.php. */
export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, m.minLength(3))
      .max(64, m.maxLength(64))
      .regex(/^[\w.-]+$/, m.usernamePattern),
    email: z.string().trim().min(1, m.required).email(m.email).max(255, m.maxLength(255)),
    password: z.string().min(8, m.minLength(8)).max(72, m.maxLength(72)),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: m.passwordMismatch,
    path: ["passwordConfirm"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Mirrors LoginForm.php, which validates presence only.
 *
 * Deliberately no length rules: adding them would lock out an existing user
 * whose password predates the current policy.
 */
export const loginSchema = z.object({
  login: z.string().trim().min(1, m.required),
  password: z.string().min(1, m.required),
});

export type LoginInput = z.infer<typeof loginSchema>;
