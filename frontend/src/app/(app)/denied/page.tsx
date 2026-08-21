import { notFound } from "next/navigation";

/**
 * Rewrite target for middleware's admin denial.
 *
 * Middleware cannot call notFound(), and a status-only 404 response renders a
 * blank document - which is itself a tell that something is there. This page
 * turns the rewrite into a genuine 404 with the app's own not-found UI, while
 * the browser URL stays on the path the visitor typed.
 *
 * Deliberately NOT under admin/: the rewrite target must not depend on the
 * admin layout gate that it exists to back up.
 */
export default function DeniedPage(): never {
  notFound();
}
