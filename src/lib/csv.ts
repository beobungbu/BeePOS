/**
 * CSV for the "Xuất CSV" action on orders, products and inventory. Pure: the file or share
 * sheet is `src/lib/export-file.ts`, this module only turns rows into text.
 *
 * RFC 4180 quoting (a cell is quoted when it carries a quote, a comma, a line break or edge
 * whitespace, and an inner quote doubles) and CRLF line endings, which is what Excel on
 * Windows expects. Money is written as a plain integer of đồng: `158000`, never `158.000 đ`,
 * because a spreadsheet has to read it as a number and the dot is a thousands separator here
 * but a decimal point in half the world's locales.
 */

/** Prefix that makes Excel read a UTF-8 file as UTF-8 instead of the system code page. */
export const CSV_BOM = '﻿';

export type CsvValue = string | number | null | undefined;

/** A single cell, quoted only when it has to be. */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  // A number is written raw (`158000`, `0.08`): no grouping, no currency sign, no locale.
  // `NaN` and the infinities are not data a spreadsheet can use, so they export as empty.
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  const needsQuotes = /["\r\n,]/.test(value) || value !== value.trim();
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Header row plus body rows as one CSV document, CRLF separated, no trailing newline. */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

/** `orders-20260913.csv`: the screen name plus the day, so two exports never collide silently. */
export function csvFilename(base: string, at: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${base}-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}.csv`;
}
