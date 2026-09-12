/**
 * The one date and time format in the app: `12/09/2026` and `14:32`, the shapes the copy
 * rules fix.
 *
 * App-wide rather than orders-local because every screen that shows a timestamp has to agree.
 * Before this file the inventory lists, the receipt and the shift screen each reached for
 * `toLocaleDateString('vi-VN')`, which drops the leading zeros (`12/9/2026`) and pins the
 * Vietnamese locale even when the cashier has switched the app to English.
 */

/** `14:32` in 24 hour form. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** `12/09/2026`. An unparseable value formats as empty rather than `Invalid Date`. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/** `12/09/2026 14:32`, used by every detail header and list meta line. */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}
