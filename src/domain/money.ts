/** Integer VND money helpers. All amounts are whole dong, no decimals. */

const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

/** Formats an integer VND amount using vi-VN currency conventions. */
export function formatVND(amount: number): string {
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
