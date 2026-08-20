"use client";

import { useState } from "react";
import { DECK_COLORS } from "@/lib/domain/deck-color";
import { cn } from "@/lib/utils/cn";
import { uz } from "@/lib/i18n/uz";

export function DeckColorPicker({ name, defaultValue }: { name: string; defaultValue?: number | null }) {
  const [selected, setSelected] = useState<number>(defaultValue ?? 0);

  return (
    <div className="flex flex-col gap-2xs">
      <span className="text-sm font-medium text-fg">{uz.deck.color}</span>
      <input type="hidden" name={name} value={selected} />
      <div role="radiogroup" aria-label={uz.deck.color} className="flex flex-wrap gap-xs">
        {DECK_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={selected === color.value}
            aria-label={color.label}
            title={color.label}
            onClick={() => setSelected(color.value)}
            className={cn(
              "size-7 rounded-full transition-transform",
              selected === color.value
                ? "ring-2 ring-border-focus ring-offset-2 ring-offset-surface"
                : "hover:scale-110",
            )}
            style={{ background: color.token }}
          />
        ))}
      </div>
    </div>
  );
}
