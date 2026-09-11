import { create } from 'zustand';
import type { Cart, Order, Shift } from '../domain/types';
import type { Refund } from '../domain/orders';
import { orders as seedOrders, shifts as seedShifts } from './seed';
import { buildSeedRefunds } from '../features/orders/lib/seed-refunds';
import { buildOrderNotes } from '../features/orders/lib/order-notes';

interface OrderState {
  orders: Order[];
  shifts: Shift[];
  cart: Cart | null;
  /** Refund ledger, keyed by `orderId`. `Order` itself carries no refund history. */
  refunds: Refund[];
  /** Per-order free-text note, keyed by `orderId`. `Order` itself has no `note` field. */
  notes: Record<string, string>;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  setCart: (cart: Cart | null) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  addRefund: (refund: Refund) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: seedOrders,
  shifts: seedShifts,
  cart: null,
  refunds: buildSeedRefunds(seedOrders),
  notes: buildOrderNotes(seedOrders),

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

  updateOrder: (order) =>
    set((state) => ({
      orders: state.orders.map((item) => (item.id === order.id ? order : item)),
    })),

  setCart: (cart) => set({ cart }),

  addShift: (shift) => set((state) => ({ shifts: [shift, ...state.shifts] })),

  updateShift: (shift) =>
    set((state) => ({
      shifts: state.shifts.map((item) => (item.id === shift.id ? shift : item)),
    })),

  addRefund: (refund) => set((state) => ({ refunds: [refund, ...state.refunds] })),
}));
