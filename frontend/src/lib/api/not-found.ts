import { notFound } from "next/navigation";
import { ApiError } from "./error";

/**
 * Collapses a missing resource and a forbidden one into the same 404.
 *
 * Inside the admin surface a 403 must not render an error page: that confirms
 * the route exists, which is what the whole hiding strategy avoids. It is also
 * the layer that catches the real race - an admin whose role is revoked
 * mid-session - where the alternative is "Serverda xatolik", both wrong and a
 * signal.
 *
 * notFound() throws, so the never return type is honest.
 */
export function notFoundOnMissing(error: unknown): never {
  if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) notFound();

  throw error;
}
