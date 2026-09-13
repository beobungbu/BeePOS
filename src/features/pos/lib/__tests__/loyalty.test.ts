/**
 * The till awards points under the chain's own rule.
 *
 * It used to award a fixed point per 10.000 đ and redeem at a fixed 1.000 đ a point, so the
 * earn rate and the tier multipliers the owner edits in Settings changed nothing and a gold
 * customer earned what a bronze one did (`reports/w-e-e2e-perf-report.md` 5.3). Each case here
 * moves one part of the rule and expects the award to move with it.
 */

import type { PointMovement } from '../../../../domain/customers';
import type { LoyaltyRule, Order } from '../../../../domain/types';
import { useCustomerStore } from '../../../../data/customer-store';
import { useLedgerStore } from '../../../../data/ledger-store';
import { useOrderStore } from '../../../../data/order-store';
import { usePricingStore } from '../../../../data/pricing-store';
import { submitOrder } from '../../adapters';
import {
  loyaltyPoints,
  loyaltyPointsForOrder,
  pointsEarnedOnOrder,
  pointsPaidOn,
  redeemedPointsFor,
} from '../loyalty';

const rule: LoyaltyRule = {
  orgId: 'org-1',
  earnPerVnd: 1 / 10_000,
  redeemVndPerPoint: 1000,
  tierThresholds: { silver: 5_000_000, gold: 20_000_000, platinum: 50_000_000 },
  tierMultiplier: { bronze: 1, silver: 1.2, gold: 1.5, platinum: 2 },
};

const order = {
  id: 'order-loyalty-1',
  total: 500_000,
  payments: [{ method: 'cash' as const, amount: 500_000 }],
} satisfies Pick<Order, 'id' | 'total' | 'payments'>;

describe('loyalty at the till', () => {
  it('earns amount x earnPerVnd at the plain rate', () => {
    expect(loyaltyPoints(rule, 500_000, 'bronze').earned).toBe(50);
  });

  it('multiplies the earn by the tier the buyer stood on', () => {
    expect(loyaltyPoints(rule, 500_000, 'silver').earned).toBe(60);
    expect(loyaltyPoints(rule, 500_000, 'gold').earned).toBe(75);
    expect(loyaltyPoints(rule, 500_000, 'platinum').earned).toBe(100);
  });

  it('follows the rule when the owner changes the earn rate', () => {
    const doubled: LoyaltyRule = { ...rule, earnPerVnd: 1 / 5000 };
    expect(loyaltyPoints(doubled, 500_000, 'bronze').earned).toBe(100);
  });

  it('redeems at the rule rate, not at a fixed thousand dong', () => {
    expect(redeemedPointsFor(rule, 30_000)).toBe(30);
    expect(redeemedPointsFor({ ...rule, redeemVndPerPoint: 1500 }, 30_000)).toBe(20);
    // A rule that redeems nothing cannot divide by zero into an infinite deduction.
    expect(redeemedPointsFor({ ...rule, redeemVndPerPoint: 0 }, 30_000)).toBe(0);
  });

  it('nets the points a bill both earned and spent', () => {
    const paid = {
      ...order,
      payments: [
        { method: 'points' as const, amount: 20_000 },
        { method: 'cash' as const, amount: 480_000 },
      ],
    };
    expect(pointsPaidOn(paid.payments)).toBe(20_000);

    const points = loyaltyPointsForOrder(paid, 'gold', rule);
    expect(points).toEqual({ earned: 75, redeemed: 20, net: 55 });
  });

  it('earns nothing on a refund of an amount, or on nothing at all', () => {
    expect(loyaltyPoints(rule, 0, 'gold').earned).toBe(0);
    expect(loyaltyPoints(rule, -100_000, 'gold').earned).toBe(0);
  });

  it('prints on the receipt what the sale awarded, not what the buyer would earn now', () => {
    // The movement holds the net the sale booked; the receipt adds back what was redeemed.
    const movements: PointMovement[] = [
      {
        id: 'pm-earn-order-loyalty-1',
        customerId: 'customer-1',
        kind: 'earned',
        points: 55,
        createdAt: '2026-09-13T02:00:00.000Z',
        orderId: order.id,
      },
    ];
    const paid = {
      ...order,
      payments: [
        { method: 'points' as const, amount: 20_000 },
        { method: 'cash' as const, amount: 480_000 },
      ],
    };
    expect(pointsEarnedOnOrder(movements, paid, rule)).toBe(75);
  });

  it('prints nothing for a sale that awarded nothing', () => {
    expect(pointsEarnedOnOrder([], order, rule)).toBe(0);
  });
});

/**
 * The wiring, not the arithmetic: changing the rule in the pricing store has to change what a
 * finished sale actually credits, which is the half of 5.3 a pure test cannot see.
 */
describe('a finished sale credits the buyer through the rule', () => {
  const CUSTOMER = 'customer-loyalty-test';

  function sale(id: string, total: number): Order {
    return {
      id,
      orgId: 'org-1',
      code: `HD-LOYALTY-${id}`,
      storeId: 'store-1',
      cashierId: 'staff-1',
      customerId: CUSTOMER,
      lines: [
        {
          productId: 'product-1',
          qty: 1,
          unitPrice: total,
          unitCostSnapshot: 0,
          priceSource: 'list',
        },
      ],
      subtotal: total,
      discountTotal: 0,
      taxTotal: 0,
      total,
      payments: [{ method: 'cash', amount: total }],
      status: 'paid',
      createdAt: '2026-09-13T02:00:00.000Z',
      channel: 'retail',
    };
  }

  beforeEach(() => {
    useCustomerStore.setState({
      customers: [
        {
          id: CUSTOMER,
          orgId: 'org-1',
          name: 'Khách thử',
          phone: '0900000000',
          points: 0,
          tier: 'gold',
          totalSpent: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          type: 'retail',
        },
      ],
      pointHistory: [],
    });
    usePricingStore.setState({ loyaltyRule: rule });
    useOrderStore.setState({ orders: [] });
    useLedgerStore.setState({ entries: [], cashBook: [] });
  });

  it('awards the tier rate the rule carries', () => {
    submitOrder(sale('order-loyalty-tier', 1_000_000));
    // 1.000.000 x 1/10.000 x 1.5 for gold.
    expect(useCustomerStore.getState().customers[0].points).toBe(150);
  });

  it('awards the new rate the moment the owner edits the rule', () => {
    usePricingStore.setState({ loyaltyRule: { ...rule, earnPerVnd: 1 / 5000 } });
    submitOrder(sale('order-loyalty-rate', 1_000_000));
    expect(useCustomerStore.getState().customers[0].points).toBe(300);
  });

  it('stamps the movement with the order, so the receipt can print it', () => {
    submitOrder(sale('order-loyalty-stamp', 1_000_000));
    const movement = useCustomerStore
      .getState()
      .pointHistory.find((item) => item.orderId === 'order-loyalty-stamp');
    expect(movement?.points).toBe(150);
  });
});
