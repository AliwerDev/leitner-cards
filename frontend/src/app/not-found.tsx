import Link from "next/link";
import { Button } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-md bg-canvas px-lg text-center">
      <p className="text-4xl font-semibold text-fg-subtle">404</p>
      <p className="text-lg text-fg">{uz.errors.pageNotFound}</p>
      <Link href="/decks">
        <Button variant="outline">{uz.common.back}</Button>
      </Link>
    </div>
  );
}
