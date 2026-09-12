/**
 * Placeholder substitution for dictionary strings. `src/i18n` returns raw templates such as
 * `Hiển thị {from} đến {to} trong {total} đơn`; the screens fill them here so the word order
 * stays a property of the translation rather than of the JSX.
 */

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
