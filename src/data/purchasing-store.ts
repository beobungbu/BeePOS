/**
 * Purchase orders and supplier returns: the two things that move between the chain and a
 * supplier before and after a goods receipt.
 */

import { create } from 'zustand';
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  SupplierReturn,
} from '../domain/types';
import { purchaseOrders as seedPurchaseOrders, supplierReturns as seedSupplierReturns } from './seed';
import { demoSeed } from './chain-seed';

/** How much of a line is still to come. */
export interface ReceiveLineInput {
  productId: string;
  qty: number;
}

interface PurchasingState {
  purchaseOrders: PurchaseOrder[];
  supplierReturns: SupplierReturn[];
  upsertPurchaseOrder: (order: PurchaseOrder) => void;
  /** draft -> sent. A no-op on any other status, so a double tap cannot re-send. */
  sendPurchaseOrder: (purchaseOrderId: string) => void;
  /**
   * Books received quantities against a sent order and moves it to `partial` or `received`.
   * Quantities are capped at what is still outstanding, so an over-receive cannot invent stock.
   */
  receivePurchaseOrder: (purchaseOrderId: string, lines: readonly ReceiveLineInput[]) => void;
  cancelPurchaseOrder: (purchaseOrderId: string) => void;
  upsertSupplierReturn: (record: SupplierReturn) => void;
  sendSupplierReturn: (supplierReturnId: string) => void;
}

function upsertBy<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some((entry) => entry.id === item.id);
  return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
}

/** The status an order lands in once its received quantities are known. */
export function statusAfterReceive(order: PurchaseOrder): PurchaseOrderStatus {
  const outstanding = order.lines.some((line) => line.receivedQty < line.qty);
  const anyReceived = order.lines.some((line) => line.receivedQty > 0);
  if (!outstanding) return 'received';
  return anyReceived ? 'partial' : 'sent';
}

/** Units still to come on a purchase order. */
export function outstandingQty(order: PurchaseOrder): number {
  return order.lines.reduce((total, line) => total + Math.max(0, line.qty - line.receivedQty), 0);
}

/** The purchasing paperwork a chain starts with. */
export function purchasingSeedForActiveOrg(): Pick<
  PurchasingState,
  'purchaseOrders' | 'supplierReturns'
> {
  return {
    purchaseOrders: demoSeed(seedPurchaseOrders, []),
    supplierReturns: demoSeed(seedSupplierReturns, []),
  };
}

export const usePurchasingStore = create<PurchasingState>((set) => ({
  ...purchasingSeedForActiveOrg(),

  upsertPurchaseOrder: (order) =>
    set((state) => ({ purchaseOrders: upsertBy(state.purchaseOrders, order) })),

  sendPurchaseOrder: (purchaseOrderId) =>
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((order) =>
        order.id === purchaseOrderId && order.status === 'draft'
          ? { ...order, status: 'sent' }
          : order,
      ),
    })),

  receivePurchaseOrder: (purchaseOrderId, lines) =>
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((order) => {
        if (order.id !== purchaseOrderId) return order;
        if (order.status === 'cancelled' || order.status === 'received') return order;

        const nextLines = order.lines.map((line) => {
          const received = lines.find((input) => input.productId === line.productId);
          if (!received || received.qty <= 0) return line;
          const room = Math.max(0, line.qty - line.receivedQty);
          return { ...line, receivedQty: line.receivedQty + Math.min(room, received.qty) };
        });

        const next = { ...order, lines: nextLines };
        return { ...next, status: statusAfterReceive(next) };
      }),
    })),

  cancelPurchaseOrder: (purchaseOrderId) =>
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((order) =>
        order.id === purchaseOrderId && order.status !== 'received'
          ? { ...order, status: 'cancelled' }
          : order,
      ),
    })),

  upsertSupplierReturn: (record) =>
    set((state) => ({ supplierReturns: upsertBy(state.supplierReturns, record) })),

  sendSupplierReturn: (supplierReturnId) =>
    set((state) => ({
      supplierReturns: state.supplierReturns.map((record) =>
        record.id === supplierReturnId && record.status === 'draft'
          ? { ...record, status: 'sent' }
          : record,
      ),
    })),
}));
