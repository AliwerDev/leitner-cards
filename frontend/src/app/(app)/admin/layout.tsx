import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { uz } from "@/lib/i18n/uz";

/** Keeps the panel out of search results even if it ever became reachable. */
export const metadata: Metadata = {
  title: { default: uz.admin.title, template: `%s — ${uz.admin.title}` },
  robots: { index: false, follow: false },
};

/**
 * The real gate.
 *
 * notFound() rather than a 403 page: a 403 confirms the route exists. Middleware
 * stops most of these before they reach here, but this is what actually renders
 * the 404, and it is the check a new /admin page cannot forget to be behind.
 *
 * Costs no extra request: getSession() is React.cache'd and (app)/layout.tsx
 * already resolved it in this render pass.
 *
 * getSession(), not requireSession(): inside the admin subtree a missing session
 * must 404 rather than redirect to login, for the same non-disclosure reason.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user.is_admin) notFound();

  return <>{children}</>;
}
