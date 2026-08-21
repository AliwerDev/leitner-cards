"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertDialog, Badge, Dropdown } from "@/components/ui";
import { UserEditDialog } from "./user-edit-dialog";
import { UserPasswordDialog } from "./user-password-dialog";
import { deleteUserAction, updateUserAction } from "@/lib/actions/admin";
import { isBlocked, statusTone } from "@/lib/domain/admin";
import { formatDate } from "@/lib/domain/format";
import { uz } from "@/lib/i18n/uz";
import { UserStatus } from "@/types/api";
import type { AdminUser } from "@/types/api";

export function UserRow({
  user,
  currentUserId,
  onDeleted,
}: {
  user: AdminUser;
  currentUserId: number;
  /** Called after a delete, so a detail page can navigate away from the row. */
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isSelf = user.id === currentUserId;
  const blocked = isBlocked(user.status);

  /**
   * Block and unblock reuse updateUserAction with a hand-built FormData.
   *
   * The (userId, prev, formData) signature serves both useActionState and a
   * direct call, the same way deleteCardAction is called from CardRow.
   */
  const handleBlockToggle = () => {
    startTransition(async () => {
      const data = new FormData();
      data.set("status", String(blocked ? UserStatus.Active : UserStatus.Inactive));
      await updateUserAction(user.id, null, data);
      setBlockOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUserAction(user.id);
      setDeleteOpen(false);

      if (onDeleted) {
        onDeleted();
        return;
      }

      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center gap-md border-b border-border px-md py-sm last:border-b-0">
        <div className="grid min-w-0 flex-1 gap-2xs sm:grid-cols-2 sm:gap-md">
          <Link
            href={`/admin/users/${user.id}`}
            className="truncate text-sm font-medium text-fg hover:underline"
          >
            {user.username}
            {isSelf ? <span className="ml-2xs text-2xs text-fg-subtle">({uz.admin.you})</span> : null}
          </Link>
          <p className="truncate text-sm text-fg-muted">{user.email}</p>
        </div>

        <div className="hidden shrink-0 items-center gap-3xs sm:flex">
          <Badge size="sm" tone={user.is_premium ? "accent" : "neutral"}>
            {user.type_label}
          </Badge>
          {user.is_admin ? (
            <Badge size="sm" tone="info">
              {user.role_label}
            </Badge>
          ) : null}
          <Badge size="sm" tone={statusTone(user.status)} dot>
            {user.status_label}
          </Badge>
        </div>

        <span className="hidden shrink-0 text-2xs text-fg-subtle lg:block">
          {formatDate(user.created_at)}
        </span>

        <Dropdown
          ariaLabel={uz.admin.manage}
          trigger={
            <span className="flex size-7 items-center justify-center rounded-md text-fg-subtle hover:bg-surface-hover">
              ⋯
            </span>
          }
          items={[
            { label: uz.common.edit, onSelect: () => setEditOpen(true) },
            { label: uz.admin.resetPassword, onSelect: () => setPasswordOpen(true) },
            {
              label: blocked ? uz.admin.unblock : uz.admin.block,
              disabled: isSelf,
              onSelect: () => setBlockOpen(true),
            },
            {
              label: uz.admin.deleteUser,
              tone: "danger",
              disabled: isSelf,
              onSelect: () => setDeleteOpen(true),
            },
          ]}
        />
      </div>

      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        isSelf={isSelf}
      />
      <UserPasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} user={user} />

      <AlertDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title={blocked ? uz.admin.unblockTitle : uz.admin.blockTitle}
        description={
          blocked ? uz.admin.unblockConfirm(user.username) : uz.admin.blockConfirm(user.username)
        }
        confirmLabel={blocked ? uz.admin.unblock : uz.admin.block}
        tone={blocked ? "accent" : "danger"}
        pending={pending}
        onConfirm={handleBlockToggle}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={uz.admin.deleteTitle}
        description={uz.admin.deleteConfirm(user.username)}
        confirmLabel={uz.common.delete}
        pending={pending}
        onConfirm={handleDelete}
      />
    </>
  );
}
