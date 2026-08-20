"use client";

import { Button } from "./button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { uz } from "@/lib/i18n/uz";

export type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "accent";
  pending?: boolean;
  onConfirm: () => void;
};

/** Confirmation preset for destructive actions. */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = uz.common.cancel,
  tone = "danger",
  pending = false,
  onConfirm,
}: AlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="sm" ariaLabel={title}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
