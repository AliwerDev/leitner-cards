"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Dropdown } from "@/components/ui";
import { logoutAction } from "@/lib/auth/actions";
import { uz } from "@/lib/i18n/uz";

export function UserMenu({ username }: { username: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Dropdown
      ariaLabel={uz.profile.account}
      trigger={
        <span className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-medium text-fg uppercase">
          {username.slice(0, 2)}
        </span>
      }
      items={[
        { label: uz.nav.profile, onSelect: () => router.push("/profile") },
        {
          label: pending ? uz.auth.loggingOut : uz.nav.logout,
          tone: "danger",
          disabled: pending,
          onSelect: () => startTransition(() => void logoutAction()),
        },
      ]}
    />
  );
}
