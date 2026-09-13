import { create } from 'zustand';
import type { Cart, DeliveryNote, Order, OrderStatus, Shift } from '../domain/types';
import type { Refund } from '../domain/orders';
import { assertTransition } from '../domain/lifecycle';
import { demoSeed } from './chain-seed';
import {
  deliveryNotes as seedDeliveryNotes,
  orders as seedOrders,
  shifts as seedShifts,
} from './seed';
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
  /** Deliveries against wholesale orders; an order can have more than one (partial delivery). */
  deliveryNotes: DeliveryNote[];
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  /**
   * Moves an order along its lifecycle. Throws on an illegal move rather than writing an
   * impossible status, so a screen wiring up the wrong button fails loudly in development.
   */
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  upsertDeliveryNote: (note: DeliveryNote) => void;
  markDelivered: (deliveryNoteId: string, at?: Date) => void;
  /** Per-order free text: the cancellation reason, and whatever the till left on the order. */
  setOrderNote: (orderId: string, note: string) => void;
  setCart: (cart: Cart | null) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  addRefund: (refund: Refund) => void;
}

/** The trading history a chain starts with: the demo shop's, or none at all. */
export function orderSeedForActiveOrg(): Pick<
  OrderState,
  'orders' | 'shifts' | 'refunds' | 'notes' | 'deliveryNotes'
> {
  return {
    orders: demoSeed(seedOrders, []),
    shifts: demoSeed(seedShifts, []),
    refunds: demoSeed(buildSeedRefunds(seedOrders), []),
    notes: demoSeed(buildOrderNotes(seedOrders), {}),
    deliveryNotes: demoSeed(seedDeliveryNotes, []),
  };
}

export const useOrderStore = create<OrderState>((set) => ({
  ...orderSeedForActiveOrg(),
  cart: null,

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

  updateOrder: (order) =>
    set((state) => ({
      orders: state.orders.map((item) => (item.id === order.id ? order : item)),
    })),

  setOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status: assertTransition(order.status, status) } : order,
      ),
    })),

  upsertDeliveryNote: (note) =>
    set((state) => {
      const exists = state.deliveryNotes.some((item) => item.id === note.id);
      return {
        deliveryNotes: exists
          ? state.deliveryNotes.map((item) => (item.id === note.id ? note : item))
          : [...state.deliveryNotes, note],
      };
    }),

  markDelivered: (deliveryNoteId, at = new Date()) =>
    set((state) => ({
      deliveryNotes: state.deliveryNotes.map((note) =>
        note.id === deliveryNoteId ? { ...note, status: 'delivered', deliveredAt: at } : note,
      ),
    })),

  setOrderNote: (orderId, note) =>
    set((state) => ({ notes: { ...state.notes, [orderId]: note } })),

  setCart: (cart) => set({ cart }),

  addShift: (shift) => set((state) => ({ shifts: [shift, ...state.shifts] })),

  updateShift: (shift) =>
    set((state) => ({
      shifts: state.shifts.map((item) => (item.id === shift.id ? shift : item)),
    })),

  addRefund: (refund) => set((state) => ({ refunds: [refund, ...state.refunds] })),
}));

/** Delivery notes raised against one order, oldest first. */
export function deliveryNotesForOrder(notes: DeliveryNote[], orderId: string): DeliveryNote[] {
  return notes.filter((note) => note.orderId === orderId);
}

/** How many units of each product an order has actually had delivered. */
export function deliveredQtyByProduct(
  notes: readonly DeliveryNote[],
  orderId: string,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const note of notes) {
    if (note.orderId !== orderId || note.status !== 'delivered') continue;
    for (const line of note.lines) {
      totals[line.productId] = (totals[line.productId] ?? 0) + line.qty;
    }
  }
  return totals;
}
