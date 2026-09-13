/**
 * Number formatting the report screens share.
 *
 * Vietnamese writes a decimal comma, and `${value} %` prints the JavaScript dot, so a margin
 * read "24.6 %" next to prices written "23.600.000 đ", where the dot is a thousands separator.
 * One helper, so no screen has to remember.
 */

/** `24.6` as `24,6`, `25` as `25`. Whole numbers keep no decimal. */
export function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

/** The same value with its unit, as every report prints it. */
export function percentLabel(value: number): string {
  return `${formatPercent(value)} %`;
}
