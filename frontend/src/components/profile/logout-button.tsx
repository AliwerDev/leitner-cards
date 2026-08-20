"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { logoutAction } from "@/lib/auth/actions";
import { uz } from "@/lib/i18n/uz";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      fullWidth
      loading={pending}
      onClick={() => startTransition(() => void logoutAction())}
    >
      {uz.nav.logout}
    </Button>
  );
}
