/**
 * The one instant the seeded chain is built around.
 *
 * Every "3 days ago" and "expires in 12 days" in the seed is measured from here rather than
 * from the wall clock, so two boots a week apart produce byte-identical data and a reviewer
 * comparing screenshots is never looking at a number that moved on its own.
 *
 * It matches the anchor the order and operation seeds already used.
 */
export const SEED_NOW = new Date('2026-09-11T09:00:00.000Z');

/** A `Date` `days` before {@link SEED_NOW}; fractional days are allowed. */
export function daysAgo(days: number): Date {
  return new Date(SEED_NOW.getTime() - days * 86_400_000);
}

/** A `Date` `days` after {@link SEED_NOW}. */
export function daysAhead(days: number): Date {
  return new Date(SEED_NOW.getTime() + days * 86_400_000);
}

/** The same as {@link daysAgo}, as the ISO string the string-dated entities carry. */
export function daysAgoIso(days: number): string {
  return daysAgo(days).toISOString();
}

/** Rounds to the nearest 500 đ, the way a shop writes a shelf or contract price. */
export function roundToLabel(amount: number): number {
  return Math.round(amount / 500) * 500;
}
