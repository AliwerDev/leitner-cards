"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Select,
} from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { updateUserAction } from "@/lib/actions/admin";
import { ROLE_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "@/lib/domain/admin";
import { uz } from "@/lib/i18n/uz";
import type { ActionResult } from "@/lib/utils/result";
import type { AdminUser } from "@/types/api";

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  isSelf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  isSelf: boolean;
}) {
  const router = useRouter();
  const action = updateUserAction.bind(null, user.id);
  const [state, formAction] = useActionState<ActionResult<AdminUser> | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const fields = state?.ok === false ? (state.fields ?? {}) : {};
  const message = state?.ok === false ? state.message : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="sm" ariaLabel={uz.admin.editTitle}>
      <DialogHeader>
        <DialogTitle>{uz.admin.editTitle}</DialogTitle>
      </DialogHeader>

      <form action={formAction}>
        <DialogBody>
          {message ? <Alert tone="danger">{message}</Alert> : null}

          <p className="text-sm text-fg-muted">
            {user.username} — {user.email}
          </p>

          <Field label={uz.admin.type} error={fields.type}>
            <Select name="type" defaultValue={user.type} options={TYPE_OPTIONS} />
          </Field>

          {/*
            Role and status are locked on your own row: demoting or blocking
            yourself ends the session and the panel with it. The backend refuses
            it too - this only keeps the operator from trying.
          */}
          <Field
            label={uz.admin.role}
            error={fields.role}
            hint={isSelf ? uz.admin.selfHint : undefined}
          >
            <Select
              name="role"
              defaultValue={user.role}
              options={ROLE_OPTIONS}
              disabled={isSelf}
            />
          </Field>

          <Field label={uz.admin.status} error={fields.status}>
            <Select
              name="status"
              defaultValue={user.status}
              options={STATUS_OPTIONS}
              disabled={isSelf}
            />
          </Field>

          <p className="text-2xs text-fg-subtle">{uz.admin.editHint}</p>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {uz.common.cancel}
          </Button>
          <SubmitButton>{uz.common.save}</SubmitButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
