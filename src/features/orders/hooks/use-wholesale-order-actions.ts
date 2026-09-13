/**
 * Everything a wholesale order detail can do to its order: move it along the lifecycle, raise
 * a delivery note, mark one delivered, and cancel it with a reason.
 *
 * The rules that are easy to get wrong live here rather than in the screen. Stock leaves the
 * branch when a note is marked **delivered**, not when the order is rung up, and an order
 * completes itself the moment its last outstanding unit arrives, so nobody has to remember to
 * press a second button.
 */

import { useMemo } from 'react';
import { canTransition } from '../../../domain/lifecycle';
import type { DeliveryNote, Order, OrderStatus } from '../../../domain/types';
import { useOrderStore } from '../../../data/order-store';
import { currentOrgId } from '../../../data/org-store';
import { releaseDeliveredStock } from '../../pos/adapters';
import { deliveryProgress, type DeliveryProgress } from '../lib/delivery';

export interface WholesaleOrderActions {
  notes: DeliveryNote[];
  progress: DeliveryProgress;
  /** Lifecycle steps this order may move to right now, in the order to offer them. */
  nextStatus: OrderStatus | undefined;
  canCancel: boolean;
  advance: () => void;
  createNote: (lines: { productId: string; qty: number }[]) => DeliveryNote | undefined;
  markDelivered: (noteId: string) => void;
  cancel: (reason: string) => void;
}

/** The step the toolbar's primary control offers: the next one along the happy path. */
const HAPPY_PATH: Record<string, OrderStatus | undefined> = {
  quote: 'confirmed',
  confirmed: 'delivering',
  delivering: 'completed',
};

export function useWholesaleOrderActions(order: Order | undefined): WholesaleOrderActions {
  const allNotes = useOrderStore((state) => state.deliveryNotes);
  const upsertDeliveryNote = useOrderStore((state) => state.upsertDeliveryNote);
  const markDeliveredIn = useOrderStore((state) => state.markDelivered);
  const setOrderStatus = useOrderStore((state) => state.setOrderStatus);
  const setOrderNote = useOrderStore((state) => state.setOrderNote);

  const notes = useMemo(
    () => (order ? allNotes.filter((note) => note.orderId === order.id) : []),
    [allNotes, order],
  );

  const progress = useMemo(
    () =>
      order
        ? deliveryProgress(order, notes)
        : { lines: [], deliveredValue: 0, pendingValue: 0, complete: false },
    [order, notes],
  );

  const nextStatus = order ? HAPPY_PATH[order.status] : undefined;
  const canCancel = Boolean(
    order && (order.status === 'quote' || order.status === 'confirmed' || order.status === 'delivering'),
  );

  return {
    notes,
    progress,
    nextStatus,
    canCancel,

    advance: () => {
      if (!order || !nextStatus) return;
      if (!canTransition(order.status, nextStatus)) return;
      setOrderStatus(order.id, nextStatus);
    },

    createNote: (lines) => {
      if (!order || lines.length === 0) return undefined;
      const note: DeliveryNote = {
        id: `delivery-${order.id}-${Date.now()}`,
        orgId: currentOrgId(),
        orderId: order.id,
        lines,
        status: 'pending',
      };
      upsertDeliveryNote(note);
      // Raising the first note is what "đang giao" means, so the status follows the act
      // rather than waiting for a second press.
      if (canTransition(order.status, 'delivering')) setOrderStatus(order.id, 'delivering');
      return note;
    },

    markDelivered: (noteId) => {
      if (!order) return;
      const note = notes.find((item) => item.id === noteId);
      if (!note || note.status === 'delivered') return;

      markDeliveredIn(noteId);
      // The goods are only off the shelves now: a wholesale order books no stock movement
      // when it is rung up, because the van may not leave for days.
      releaseDeliveredStock(order.storeId, note.lines);

      const after = deliveryProgress(order, [
        ...notes.filter((item) => item.id !== noteId),
        { ...note, status: 'delivered' as const },
      ]);
      if (after.complete && canTransition(order.status, 'completed')) {
        setOrderStatus(order.id, 'completed');
      }
    },

    cancel: (reason) => {
      if (!order || !canTransition(order.status, 'cancelled')) return;
      setOrderStatus(order.id, 'cancelled');
      setOrderNote(order.id, reason);
    },
  };
}
