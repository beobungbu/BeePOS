/**
 * Pure domain logic for customers and loyalty points. No React, no store, no BeeUI imports.
 */

import type { Customer, CustomerTier } from './types';

/** totalSpent (VND) thresholds a customer must reach to hold each tier above 'bronze'. */
export const TIER_THRESHOLDS: Record<Exclude<CustomerTier, 'bronze'>, number> = {
  silver: 2_000_000,
  gold: 8_000_000,
  platinum: 20_000_000,
};

/** Maps lifetime spend to a loyalty tier. Matches the thresholds baked into seed data. */
export function tierFor(totalSpent: number): CustomerTier {
  if (totalSpent >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (totalSpent >= TIER_THRESHOLDS.gold) return 'gold';
  if (totalSpent >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Validates a Vietnamese mobile phone number: an optional `+84`/`84` country code or a
 * leading `0`, followed by one of the current mobile head-digits (3, 5, 7, 8, 9) and 8 more
 * digits. Spaces, dots and dashes are ignored.
 */
export function isValidVnPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, '');
  return /^(0|\+?84)(3|5|7|8|9)\d{8}$/.test(cleaned);
}

export interface CustomerFilters {
  /** Matches name or phone, case-insensitive. */
  search?: string;
  tier?: CustomerTier;
}

export function filterCustomers(customers: Customer[], filters: CustomerFilters): Customer[] {
  const search = filters.search?.trim().toLowerCase();

  return customers.filter((customer) => {
    if (filters.tier && customer.tier !== filters.tier) return false;
    if (search) {
      const name = customer.name.toLowerCase();
      const phone = customer.phone.toLowerCase();
      if (!name.includes(search) && !phone.includes(search)) return false;
    }
    return true;
  });
}

export type PointMovementKind = 'earned' | 'spent' | 'adjust';

export interface PointMovement {
  id: string;
  customerId: string;
  kind: PointMovementKind;
  /** Signed point delta: positive for earn, negative for spend/deduction. */
  points: number;
  note?: string;
  createdAt: string;
  orderId?: string;
}

/** Returns a customer's point movements in chronological order. */
export function pointHistory(movements: PointMovement[], customerId: string): PointMovement[] {
  return movements
    .filter((movement) => movement.customerId === customerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
