import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, letting later Tailwind utilities win over earlier ones.
 *
 * Without twMerge, `cn("p-md", "p-lg")` emits both and the winner depends on
 * stylesheet order rather than call order - which makes a `className` prop on a
 * primitive unreliable.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
