/**
 * The refund, void and reprint side effects of one order, shared by the detail screen and by
 * the desktop preview pane so both spend the same money exactly once and in the same order:
 * record the refund, restock the lines, move the order's status, then correct the customer.
 */

import { useMemo } from 'react';
import { useToast } from '@beemvp/beeui-ui';
import { useOrderStore } from '../../../data/order-store';
import { useCustomerStore } from '../../../data/customer-store';
import { useInventoryStore } from '../../../data/inventory-store';
import { applyRefund, canVoid, type Refund, type RefundPlanResult } from '../../../domain/orders';
import { sum } from '../../../domain/money';
import type { Order, PaymentMethod } from '../../../domain/types';
import { useT } from '../../../i18n';

export interface OrderActions {
  /** Refunds recorded against this order, oldest first. */
  refunds: Refund[];
  priorRefundedAmount: number;
  canRefund: boolean;
  canVoidNow: boolean;
  refund: (input: { plan: RefundPlanResult; method: PaymentMethod; reason: string }) => void;
  voidOrder: () => void;
  reprint: () => void;
}

export function useOrderActions(order: Order | undefined): OrderActions {
  const t = useT();
  const toast = useToast();

  // Select the raw array (stable reference) and derive with useMemo: an inline `.filter()`
  // inside the zustand selector returns a new array every call, which makes
  // useSyncExternalStore see a changed snapshot on every render and loops forever
  // ("Maximum update depth exceeded").
  const allRefunds = useOrderStore((state) => state.refunds);
  const addRefund = useOrderStore((state) => state.addRefund);
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const refundCustomer = useCustomerStore((state) => state.refundCustomer);

  const refunds = useMemo(
    () => (order ? allRefunds.filter((item) => item.orderId === order.id) : []),
    [allRefunds, order],
  );
  const priorRefundedAmount = useMemo(() => sum(refunds.map((refund) => refund.amount)), [refunds]);

  const canRefund =
    !!order && (order.status === 'paid' || order.status === 'partial_refund') && priorRefundedAmount < order.total;
  const canVoidNow = !!order && canVoid(order, refunds.length > 0);

  const refund: OrderActions['refund'] = ({ plan, method, reason }) => {
    if (!order || !plan.valid) return;

    const record: Refund = {
      id: `refund-${order.id}-${Date.now()}`,
      orderId: order.id,
      createdAt: new Date().toISOString(),
      lines: plan.lines,
      method,
      reason,
      amount: plan.amount,
      pointsDeducted: plan.pointsToDeduct,
    };

    addRefund(record);
    plan.lines.forEach((line) => adjustStock(line.productId, order.storeId, line.qty));
    updateOrder({ ...order, status: applyRefund(order, priorRefundedAmount, plan.amount) });

    if (order.customerId) {
      refundCustomer({
        customerId: order.customerId,
        points: plan.pointsToDeduct,
        spent: plan.amount,
        note: `${t('orders.actions.refund')} ${order.code}`,
        createdAt: record.createdAt,
        orderId: order.id,
      });
    }

    toast.show({
      title: t('orders.refundDialog.successToastTitle'),
      description: t('orders.refundDialog.successToastDescription'),
      variant: 'success',
    });
  };

  const voidOrder = () => {
    if (!order) return;
    updateOrder({ ...order, status: 'void' });
    toast.show({ title: t('orders.voidDialog.successToastTitle'), variant: 'success' });
  };

  const reprint = () => {
    toast.show({ title: t('orders.reprintToast.title'), description: t('orders.reprintToast.description') });
  };

  return { refunds, priorRefundedAmount, canRefund, canVoidNow, refund, voidOrder, reprint };
}
