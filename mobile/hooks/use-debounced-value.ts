import { useEffect, useState } from "react";

/**
 * Delay a fast-changing value.
 *
 * Used by the card search: the backend caps `q` at 255 characters and runs an
 * ILIKE over two columns, so a request per keystroke is both wasteful and
 * slower than the typing.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
