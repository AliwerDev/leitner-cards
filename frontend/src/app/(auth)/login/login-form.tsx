"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { uz } from "@/lib/i18n/uz";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, null);
  const fields = state?.ok === false ? (state.fields ?? {}) : {};
  const message = state?.ok === false ? state.message : undefined;

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-3xs">
        <h1 className="text-2xl">{uz.auth.loginTitle}</h1>
        <p className="text-sm text-fg-muted">{uz.auth.loginSubtitle}</p>
      </div>

      {message ? <Alert tone="danger" title={message} /> : null}

      <form action={formAction} className="flex flex-col gap-md">
        {/* The backend matches this against username OR email, so the label
            must not say "username". */}
        <Field label={uz.auth.loginField} error={fields.login} required>
          <Input name="login" autoComplete="username" autoFocus />
        </Field>

        <Field label={uz.auth.password} error={fields.password} required>
          <Input name="password" type="password" autoComplete="current-password" />
        </Field>

        <SubmitButton fullWidth size="lg">
          {uz.auth.loginSubmit}
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-fg-muted">
        {uz.auth.noAccount}{" "}
        <Link href="/register" className="font-medium text-accent-text hover:underline">
          {uz.auth.registerSubmit}
        </Link>
      </p>
    </div>
  );
}
