/**
 * The time ranges the stats page offers.
 *
 * Deliberately NOT in stats-filters.tsx: that module is "use client", and a
 * server component importing a value across the client boundary gets a module
 * reference rather than the array itself, so DAY_RANGES.includes() is not a
 * function at runtime. Plain constants shared by both sides belong here.
 */
export const DAY_RANGES = [7, 30, 90] as const;

export type DayRange = (typeof DAY_RANGES)[number];

export const DEFAULT_DAYS: DayRange = 30;

/** Narrows an arbitrary query value to a range the filter actually offers. */
export function parseDayRange(raw?: string): DayRange {
  const value = raw ? Number(raw) : NaN;
  return DAY_RANGES.find((range) => range === value) ?? DEFAULT_DAYS;
}
