"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { uz } from "@/lib/i18n/uz";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-md bg-canvas px-lg text-center">
      <p className="text-lg text-fg">{uz.errors.unexpected}</p>
      <Button variant="outline" onClick={reset}>
        {uz.common.retry}
      </Button>
    </div>
  );
}
