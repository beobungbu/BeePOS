/**
 * What a promotion is doing right now, and what it is aimed at.
 *
 * Four states rather than the two the record carries: `isActive` says whether the chain wants
 * the programme to run, the window says whether it can. A shop owner reading the list needs
 * to tell "starts on Monday" from "somebody switched it off", and one boolean cannot.
 */

import type { Promotion } from '../../../domain/types';

export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'paused';

/** Scope of the offer: everything in the catalogue, named products, or whole categories. */
export type PromotionScope = 'all' | 'products' | 'categories';

export function promotionStatus(promotion: Promotion, now: Date): PromotionStatus {
  if (promotion.endsAt.getTime() < now.getTime()) return 'expired';
  if (!promotion.isActive) return 'paused';
  if (promotion.startsAt.getTime() > now.getTime()) return 'scheduled';
  return 'active';
}

/** Ended programmes stay in the list at reduced opacity so next season can clone them. */
export function isFinished(status: PromotionStatus): boolean {
  return status === 'expired';
}

export function promotionScope(promotion: Promotion): PromotionScope {
  if (promotion.productIds && promotion.productIds.length > 0) return 'products';
  if (promotion.categoryIds && promotion.categoryIds.length > 0) return 'categories';
  return 'all';
}

/** Store ids the promotion runs at, or `null` for every branch. */
export function promotionStores(promotion: Promotion): string[] | null {
  return promotion.storeIds && promotion.storeIds.length > 0 ? promotion.storeIds : null;
}

/** The programmes running or waiting to run, newest window first; ended ones last. */
export function sortPromotions(promotions: readonly Promotion[], now: Date): Promotion[] {
  const rank: Record<PromotionStatus, number> = { active: 0, scheduled: 1, paused: 2, expired: 3 };
  return [...promotions].sort((a, b) => {
    const byStatus = rank[promotionStatus(a, now)] - rank[promotionStatus(b, now)];
    if (byStatus !== 0) return byStatus;
    return b.startsAt.getTime() - a.startsAt.getTime() || a.name.localeCompare(b.name);
  });
}

/** Matches a promotion against the list search box: name, and the type word the caller folds in. */
export function matchesQuery(promotion: Promotion, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  return promotion.name.toLowerCase().includes(needle);
}
