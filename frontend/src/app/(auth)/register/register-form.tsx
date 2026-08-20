"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/auth/actions";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { uz } from "@/lib/i18n/uz";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const fields = state?.ok === false ? (state.fields ?? {}) : {};
  const message = state?.ok === false ? state.message : undefined;

  return (
    <div className="gap-lg flex flex-col">
      <div className="gap-3xs flex flex-col">
        <h1 className="text-2xl">{uz.auth.registerTitle}</h1>
        <p className="text-fg-muted text-sm">{uz.auth.registerSubtitle}</p>
      </div>

      {message ? <Alert tone="danger" title={message} /> : null}

      <form action={formAction} className="gap-md flex flex-col">
        <Field
          label={uz.auth.username}
          error={fields.username}
          hint={uz.auth.usernameHint}
          required
        >
          <Input name="username" autoComplete="username" autoFocus />
        </Field>

        <Field label={uz.auth.email} error={fields.email} required>
          <Input name="email" type="email" autoComplete="email" />
        </Field>

        <Field
          label={uz.auth.password}
          error={fields.password}
          hint={uz.auth.passwordHint}
          required
        >
          <Input name="password" type="password" autoComplete="new-password" />
        </Field>

        <Field label={uz.auth.passwordConfirm} error={fields.passwordConfirm} required>
          <Input name="passwordConfirm" type="password" autoComplete="new-password" />
        </Field>

        <SubmitButton fullWidth size="lg">
          {uz.auth.registerSubmit}
        </SubmitButton>
      </form>

      <p className="text-fg-muted text-center text-sm">
        {uz.auth.hasAccount}{" "}
        <Link href="/login" className="text-accent-text font-medium hover:underline">
          {uz.auth.loginSubmit}
        </Link>
      </p>
    </div>
  );
}
