/**
 * What one sale does to a buyer's point balance, under the chain's own `LoyaltyRule`.
 *
 * The till used to award a fixed point per 10.000 đ and to redeem at a fixed 1.000 đ a point,
 * so the earn rate and the tier multipliers the owner edits in Settings changed nothing and a
 * gold customer earned what a bronze one did. Everything here reads the rule instead, and one
 * function answers for the till, the checkout preview and the receipt so the three cannot
 * quote three different figures.
 */

import { pointsEarnedForTier } from '../../../domain/pricing';
import type { PointMovement } from '../../../domain/customers';
import type { CustomerTier, LoyaltyRule, Order, Payment } from '../../../domain/types';

export interface LoyaltyPoints {
  /** Points the sale earns: amount x earnPerVnd x the tier's multiplier. */
  earned: number;
  /** Points handed back as payment, at the rule's redeem rate. */
  redeemed: number;
  /** What the balance actually moves by. */
  net: number;
}

/** Dong of this bill settled with points. */
export function pointsPaidOn(payments: readonly Payment[]): number {
  return payments
    .filter((payment) => payment.method === 'points')
    .reduce((total, payment) => total + payment.amount, 0);
}

/** Points an amount tendered in points amounts to, at the rule's redeem rate. */
export function redeemedPointsFor(rule: LoyaltyRule, pointsPaid: number): number {
  if (pointsPaid <= 0 || rule.redeemVndPerPoint <= 0) return 0;
  return Math.round(pointsPaid / rule.redeemVndPerPoint);
}

/**
 * Earned, redeemed and net for an amount at a tier.
 *
 * The tier is passed in rather than read off the customer, because the sale itself can move
 * the customer up a tier: the points a bill earned are the ones its own tier was worth at the
 * moment it was rung up.
 */
export function loyaltyPoints(
  rule: LoyaltyRule,
  amount: number,
  tier: CustomerTier,
  pointsPaid = 0,
): LoyaltyPoints {
  const earned = pointsEarnedForTier(rule, amount, tier);
  const redeemed = redeemedPointsFor(rule, pointsPaid);
  return { earned, redeemed, net: earned - redeemed };
}

/**
 * What a finished sale earned, read back off the point movement it wrote.
 *
 * The receipt prints this rather than re-running the rule: the sale may have moved the buyer
 * up a tier, and a receipt that recomputes would then print points the sale did not award.
 * The movement holds the net change, so the points handed back as payment are added again to
 * get what was earned.
 */
export function pointsEarnedOnOrder(
  movements: readonly PointMovement[],
  order: Pick<Order, 'id' | 'payments'>,
  rule: LoyaltyRule,
): number {
  const movement = movements.find((item) => item.orderId === order.id && item.kind === 'earned');
  if (!movement) return 0;
  return movement.points + redeemedPointsFor(rule, pointsPaidOn(order.payments));
}

/** The same for a finished order, whose points payment is already on it. */
export function loyaltyPointsForOrder(
  order: Pick<Order, 'total' | 'payments'>,
  tier: CustomerTier,
  rule: LoyaltyRule,
): LoyaltyPoints {
  return loyaltyPoints(rule, order.total, tier, pointsPaidOn(order.payments));
}
