"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Dropdown, type DropdownItem } from "@/components/ui";
import { useSession } from "./session-provider";
import { logoutAction } from "@/lib/auth/actions";
import { uz } from "@/lib/i18n/uz";

export function UserMenu({ username }: { username: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { user } = useSession();

  /*
   * The admin entry lives here rather than in NAV_ITEMS.
   *
   * NAV_ITEMS is consumed by both the island and the dock, so a conditional
   * entry would have to be filtered in two places, and the dock has no room for
   * a fourth item on a narrow phone. /profile is reached the same way - a real
   * route that is not in the primary nav.
   *
   * is_admin therefore reaches the client for every signed-in account. That is
   * the user's OWN flag, not a list of admins, and it reveals only that the app
   * has an admin concept.
   */
  const items: DropdownItem[] = [
    { label: uz.nav.profile, onSelect: () => router.push("/profile") },
  ];

  if (user.is_admin) {
    items.push({ label: uz.nav.admin, onSelect: () => router.push("/admin") });
  }

  items.push({
    label: pending ? uz.auth.loggingOut : uz.nav.logout,
    tone: "danger",
    disabled: pending,
    onSelect: () => startTransition(() => void logoutAction()),
  });

  return (
    <Dropdown
      ariaLabel={uz.profile.account}
      trigger={
        <span className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-medium text-fg uppercase">
          {username.slice(0, 2)}
        </span>
      }
      items={items}
    />
  );
}
