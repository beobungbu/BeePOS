/**
 * Lots, expiry dates and the three grades the stockroom works in.
 *
 * The store holds the batches (`src/data/lot-store.ts`); this module says what a batch means
 * today. Kept in the inventory feature because the sell screen needs the same answer the
 * expiring report gives, and two thresholds in two files is how a warning appears on one
 * screen and not the other.
 */

import { expiringLots, useLotStore } from '../../../data/lot-store';
import type { Lot } from '../../../domain/types';

/** Under this many days left the batch is a warning; at or past the date it is a failure. */
export const EXPIRY_SOON_DAYS = 15;

/** The two windows the expiring report offers. 30 is the default the notification uses too. */
export const EXPIRY_WINDOWS = [30, 60] as const;
export type ExpiryWindow = (typeof EXPIRY_WINDOWS)[number];

const DAY_MS = 86_400_000;

export type LotGrade = 'expired' | 'soon' | 'ahead';

/** Whole days from `now` to the expiry; negative once the date has passed. */
export function daysUntil(expiresAt: Date, now: Date = new Date()): number {
  return Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS);
}

/** Expired, inside the 15 day warning, or simply ahead. An undated batch is never a warning. */
export function gradeLot(lot: Lot, now: Date = new Date()): LotGrade {
  if (!lot.expiresAt) return 'ahead';
  const days = daysUntil(lot.expiresAt, now);
  if (days <= 0) return 'expired';
  return days <= EXPIRY_SOON_DAYS ? 'soon' : 'ahead';
}

/** Batches of one product at one branch, soonest expiry first. Pure. */
export function lotsIn(
  lots: readonly Lot[],
  productId: string,
  storeId: string,
): Lot[] {
  return lots
    .filter((lot) => lot.productId === productId && lot.storeId === storeId)
    .sort((a, b) => (a.expiresAt?.getTime() ?? Infinity) - (b.expiresAt?.getTime() ?? Infinity));
}

/**
 * Batches of one product at one branch that are expired or expiring inside `withinDays`,
 * soonest first. Pure; `expiringLotsFor` is the same answer read off the store.
 */
export function expiringLotsIn(
  lots: readonly Lot[],
  productId: string,
  storeId: string,
  now: Date = new Date(),
  withinDays: number = EXPIRY_SOON_DAYS,
): Lot[] {
  return expiringLots(
    lots.filter((lot) => lot.productId === productId && lot.storeId === storeId),
    now,
    withinDays,
  );
}

/**
 * The batches of a product at a branch that the sell screen should warn about: expired, or
 * inside the 15 day window, soonest first. Empty for a product that tracks no lots.
 *
 * This is the entry point the POS tile uses (W-P); it takes no store handle because a tile
 * renders hundreds of times and threading the lot list through every one of them buys nothing.
 */
export function expiringLotsFor(
  productId: string,
  storeId: string,
  withinDays: number = EXPIRY_SOON_DAYS,
  now: Date = new Date(),
): Lot[] {
  return expiringLotsIn(useLotStore.getState().lots, productId, storeId, now, withinDays);
}

/** Units on hand across a product's batches at a branch. */
export function lotOnHand(lots: readonly Lot[], productId: string, storeId: string): number {
  return lotsIn(lots, productId, storeId).reduce((total, lot) => total + lot.onHand, 0);
}

/** Units sitting in batches that are already past their date. */
export function expiredOnHand(lots: readonly Lot[], now: Date = new Date()): number {
  return lots
    .filter((lot) => lot.onHand > 0 && gradeLot(lot, now) === 'expired')
    .reduce((total, lot) => total + lot.onHand, 0);
}

/* -------------------------------------------------------------------------- */
/* Typed expiry dates                                                          */
/* -------------------------------------------------------------------------- */

const EXPIRY_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * `12/10/2026` as a date, or `undefined` when the text is not one. Day first, which is what
 * the rest of the app prints (`src/lib/datetime.ts`), and the calendar is checked rather than
 * rolled over: `31/02/2026` is a typo, not the third of March.
 */
export function parseExpiryInput(value: string): Date | undefined {
  const match = EXPIRY_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
}

/** `12/10/2026` from a date, and empty from nothing, so an input can round-trip. */
export function formatExpiryInput(value: Date | undefined): string {
  if (!value) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
}
