/** Integer VND money helpers. All amounts are whole dong, no decimals. */

const VND_FORMATTER = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/**
 * Formats an integer VND amount as `9.000 đ`: vi-VN grouping, a space, then the letter đ.
 * Vietnamese retail copy writes the unit as the letter, not the dong sign (U+20AB).
 */
export function formatVND(amount: number): string {
  return `${VND_FORMATTER.format(roundVND(amount))} đ`;
}

/**
 * The same grouped number without the unit, for places where the unit is already in the
 * surrounding copy or would not fit: the quick-cash chips read `200.000`, not `200.000 đ`.
 */
export function formatAmount(amount: number): string {
  return VND_FORMATTER.format(roundVND(amount));
}

/** Rounds any numeric amount to the nearest whole dong (VND has no subunit). */
export function roundVND(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

/** Sums a list of numbers and rounds the result to whole dong. */
export function sum(amounts: number[]): number {
  return roundVND(amounts.reduce((total, value) => total + value, 0));
}
