import { create } from 'zustand';
import type { GoodsReceipt, StockCount, StockLevel, StockTransfer } from '../domain/types';
import { applyMovement, countVariance, transferTransition, type StockMovement, type StockMovementInput } from '../domain/inventory';
import {
  goodsReceipts as seedGoodsReceipts,
  stockCounts as seedStockCounts,
  stockLevels as seedStockLevels,
  stockTransfers as seedStockTransfers,
} from './seed';

interface InventoryState {
  stockLevels: StockLevel[];
  goodsReceipts: GoodsReceipt[];
  stockTransfers: StockTransfer[];
  stockCounts: StockCount[];
  /** Chronological log of every stock change, newest first. */
  movements: StockMovement[];
  adjustStock: (productId: string, storeId: string, delta: number, reason?: string) => void;
  /**
   * Sets on hand to an absolute quantity, creating the level row when the product has none at
   * that branch yet. `adjustStock` cannot do this: it applies a delta to a row that exists, and
   * a product that has just been imported has no row anywhere.
   */
  setStockLevel: (productId: string, storeId: string, onHand: number, reason?: string) => void;
  setMinLevel: (productId: string, storeId: string, minLevel: number) => void;
  upsertGoodsReceipt: (receipt: GoodsReceipt) => void;
  upsertStockTransfer: (transfer: StockTransfer) => void;
  upsertStockCount: (count: StockCount) => void;
  /** Marks a draft receipt as received and adds its lines to on-hand stock at its store. */
  receiveGoodsReceipt: (receiptId: string) => void;
  /** draft -> sent: ships lines out of the source store's on hand into the destination's reserved. */
  sendTransfer: (transferId: string) => void;
  /** sent -> received: moves the destination's reserved lines into its on hand. */
  receiveTransfer: (transferId: string) => void;
  /** Posts a draft stock count: sets on hand to the counted quantity and logs the variance. */
  postStockCount: (countId: string) => void;
}

function upsertBy<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some((entry) => entry.id === item.id);
  return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
}

function nextMovementId(existing: readonly StockMovement[]): string {
  return `mov-${existing.length + 1}-${Date.now()}`;
}

export const useInventoryStore = create<InventoryState>((set, get) => {
  function logMovement(input: StockMovementInput) {
    const movement: StockMovement = {
      ...input,
      id: nextMovementId(get().movements),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ movements: [movement, ...state.movements] }));
  }

  return {
    stockLevels: seedStockLevels,
    goodsReceipts: seedGoodsReceipts,
    stockTransfers: seedStockTransfers,
    stockCounts: seedStockCounts,
    movements: [],

    adjustStock: (productId, storeId, delta, reason = 'adjustment') => {
      set((state) => ({
        stockLevels: applyMovement(state.stockLevels, { productId, storeId, delta }),
      }));
      logMovement({ productId, storeId, delta, reason });
    },

    setStockLevel: (productId, storeId, onHand, reason = 'import') => {
      const target = Math.max(0, onHand);
      const current = get().stockLevels.find(
        (level) => level.productId === productId && level.storeId === storeId,
      );
      if (current && current.onHand === target) return;

      set((state) => ({
        stockLevels: current
          ? state.stockLevels.map((level) =>
              level.productId === productId && level.storeId === storeId
                ? { ...level, onHand: target }
                : level,
            )
          : [...state.stockLevels, { productId, storeId, onHand: target, reserved: 0, minLevel: 0 }],
      }));
      logMovement({ productId, storeId, delta: target - (current?.onHand ?? 0), reason });
    },

    setMinLevel: (productId, storeId, minLevel) =>
      set((state) => ({
        stockLevels: state.stockLevels.map((level) =>
          level.productId === productId && level.storeId === storeId
            ? { ...level, minLevel: Math.max(0, minLevel) }
            : level,
        ),
      })),

    upsertGoodsReceipt: (receipt) =>
      set((state) => ({ goodsReceipts: upsertBy(state.goodsReceipts, receipt) })),

    upsertStockTransfer: (transfer) =>
      set((state) => ({ stockTransfers: upsertBy(state.stockTransfers, transfer) })),

    upsertStockCount: (count) => set((state) => ({ stockCounts: upsertBy(state.stockCounts, count) })),

    receiveGoodsReceipt: (receiptId) => {
      const receipt = get().goodsReceipts.find((item) => item.id === receiptId);
      if (!receipt || receipt.status === 'received') return;

      set((state) => ({
        stockLevels: receipt.lines.reduce(
          (levels, line) =>
            applyMovement(levels, { productId: line.productId, storeId: receipt.storeId, delta: line.qty }),
          state.stockLevels,
        ),
        goodsReceipts: state.goodsReceipts.map((item) =>
          item.id === receiptId ? { ...item, status: 'received' } : item,
        ),
      }));
      for (const line of receipt.lines) {
        logMovement({
          productId: line.productId,
          storeId: receipt.storeId,
          delta: line.qty,
          reason: `receipt:${receiptId}`,
        });
      }
    },

    sendTransfer: (transferId) => {
      const transfer = get().stockTransfers.find((item) => item.id === transferId);
      if (!transfer) return;
      const nextStatus = transferTransition(transfer.status, 'send');

      set((state) => ({
        stockLevels: transfer.lines.reduce((levels, line) => {
          const shippedOut = applyMovement(levels, {
            productId: line.productId,
            storeId: transfer.fromStoreId,
            delta: -line.qty,
          });
          return applyMovement(shippedOut, {
            productId: line.productId,
            storeId: transfer.toStoreId,
            delta: line.qty,
            field: 'reserved',
          });
        }, state.stockLevels),
        stockTransfers: state.stockTransfers.map((item) =>
          item.id === transferId ? { ...item, status: nextStatus } : item,
        ),
      }));
      for (const line of transfer.lines) {
        logMovement({
          productId: line.productId,
          storeId: transfer.fromStoreId,
          delta: -line.qty,
          reason: `transfer-out:${transferId}`,
        });
      }
    },

    receiveTransfer: (transferId) => {
      const transfer = get().stockTransfers.find((item) => item.id === transferId);
      if (!transfer) return;
      const nextStatus = transferTransition(transfer.status, 'receive');

      set((state) => ({
        stockLevels: transfer.lines.reduce((levels, line) => {
          const unreserved = applyMovement(levels, {
            productId: line.productId,
            storeId: transfer.toStoreId,
            delta: -line.qty,
            field: 'reserved',
          });
          return applyMovement(unreserved, {
            productId: line.productId,
            storeId: transfer.toStoreId,
            delta: line.qty,
          });
        }, state.stockLevels),
        stockTransfers: state.stockTransfers.map((item) =>
          item.id === transferId ? { ...item, status: nextStatus } : item,
        ),
      }));
      for (const line of transfer.lines) {
        logMovement({
          productId: line.productId,
          storeId: transfer.toStoreId,
          delta: line.qty,
          reason: `transfer-in:${transferId}`,
        });
      }
    },

    postStockCount: (countId) => {
      const count = get().stockCounts.find((item) => item.id === countId);
      if (!count || count.status === 'posted') return;

      set((state) => ({
        stockLevels: state.stockLevels.map((level) => {
          const line = count.lines.find(
            (item) => item.productId === level.productId && level.storeId === count.storeId,
          );
          return line ? { ...level, onHand: line.counted } : level;
        }),
        stockCounts: state.stockCounts.map((item) =>
          item.id === countId ? { ...item, status: 'posted' } : item,
        ),
      }));
      for (const line of count.lines) {
        const variance = countVariance(line);
        if (variance === 0) continue;
        logMovement({
          productId: line.productId,
          storeId: count.storeId,
          delta: variance,
          reason: `count:${countId}`,
        });
      }
    },
  };
});
