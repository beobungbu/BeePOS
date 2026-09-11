/**
 * Converts between BeeUI's `CalendarDate` ({ day, month, year }, month is 1-12) and the
 * `YYYY-MM-DD` strings used by domain filters / seed data. Kept local (not in src/domain)
 * since `CalendarDate`'s shape is a BeeUI concept, not a BeePOS domain one.
 */

export interface CalendarDateLike {
  day: number;
  month: number;
  year: number;
}

export function isoToCalendarDate(iso: string): CalendarDateLike {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return { year, month, day };
}

export function calendarDateToIso(date: CalendarDateLike): string {
  const y = String(date.year).padStart(4, '0');
  const m = String(date.month).padStart(2, '0');
  const d = String(date.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
