/**
 * What the checkout inputs currently describe, as a value: which payment would be recorded,
 * how much change that leaves, and whether it settles the order. Keeping this pure is what
 * lets one primary button read "Thêm thanh toán · 31.500 đ" while the balance is short and
 * "Hoàn tất · 81.500 đ" the moment the cashier has enough in hand.
 */

import { calcChange, pointsToVnd } from '../../../domain/pos';
import { roundVND } from '../../../domain/money';
import type { Payment, PaymentMethod } from '../../../domain/types';

export interface PaymentDraftInput {
  method: PaymentMethod;
  /** Amount still unpaid on the order, in dong. */
  remaining: number;
  /** Raw field text: cash tendered, transfer amount, or card amount. */
  amountText: string;
  /** Card reference, optional. */
  refText?: string;
  /** Points the cashier wants to redeem. */
  pointsText?: string;
  /** Points the attached customer actually has; undefined when no customer is attached. */
  customerPoints?: number;
}

export interface PaymentDraft {
  /** The payment that would be recorded; absent while the inputs describe nothing yet. */
  payment?: Payment;
  /** Cash only: what goes back to the customer once this payment is recorded. */
  change: number;
  /** True when recording this payment leaves nothing to pay. */
  settlesBalance: boolean;
  /** Points only: more points typed than the customer holds. */
  exceedsPoints: boolean;
}

function parseAmount(text: string): number {
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) && parsed > 0 ? roundVND(parsed) : 0;
}

export function draftPayment(input: PaymentDraftInput): PaymentDraft {
  const { method, remaining } = input;
  const empty: PaymentDraft = { change: 0, settlesBalance: remaining <= 0, exceedsPoints: false };

  if (method === 'points') {
    const available = input.customerPoints ?? 0;
    const requested = Math.max(0, Math.floor(Number.parseFloat(input.pointsText ?? '') || 0));
    const usable = Math.min(requested, available);
    const amount = Math.min(remaining, pointsToVnd(usable));
    if (usable <= 0 || amount <= 0) return { ...empty, exceedsPoints: requested > available };
    return {
      payment: { method, amount, ref: `points=${usable}` },
      change: 0,
      settlesBalance: amount >= remaining,
      exceedsPoints: requested > available,
    };
  }

  const entered = parseAmount(input.amountText);
  if (entered <= 0) return empty;

  const amount = Math.min(remaining, entered);
  if (method === 'cash') {
    return {
      // The tendered amount rides along in `ref` so the receipt can show the change.
      payment: { method, amount, ref: `tendered=${entered}` },
      change: calcChange(amount, entered),
      settlesBalance: entered >= remaining,
      exceedsPoints: false,
    };
  }

  const ref = method === 'card' ? input.refText?.trim() || undefined : undefined;
  return {
    payment: { method, amount, ref },
    change: 0,
    settlesBalance: amount >= remaining,
    exceedsPoints: false,
  };
}
