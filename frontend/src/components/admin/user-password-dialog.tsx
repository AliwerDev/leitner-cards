"use client";

import { useActionState, useEffect } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
} from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { resetPasswordAction } from "@/lib/actions/admin";
import { uz } from "@/lib/i18n/uz";
import type { ActionResult } from "@/lib/utils/result";
import type { AdminUser } from "@/types/api";

/**
 * Sets a new password for another account.
 *
 * The value is never echoed back: the action deliberately skips retainValues, so
 * a failed submit clears the field rather than round-tripping the password
 * through the RSC payload.
 */
export function UserPasswordDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
}) {
  const action = resetPasswordAction.bind(null, user.id);
  const [state, formAction] = useActionState<ActionResult<string> | null, FormData>(action, null);

  useEffect(() => {
    if (state?.ok) onOpenChange(false);
  }, [state, onOpenChange]);

  const fields = state?.ok === false ? (state.fields ?? {}) : {};
  const message = state?.ok === false ? state.message : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      ariaLabel={uz.admin.resetPasswordTitle}
    >
      <DialogHeader>
        <DialogTitle>{uz.admin.resetPasswordTitle}</DialogTitle>
      </DialogHeader>

      <form action={formAction}>
        <DialogBody>
          {message ? <Alert tone="danger">{message}</Alert> : null}

          <p className="text-sm text-fg-muted">{user.username}</p>

          <Field
            label={uz.admin.newPassword}
            error={fields.password}
            hint={uz.admin.resetPasswordHint}
            required
          >
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              autoFocus
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {uz.common.cancel}
          </Button>
          <SubmitButton>{uz.admin.resetPassword}</SubmitButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
