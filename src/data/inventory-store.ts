import { create } from 'zustand';
import type { GoodsReceipt, StockCount, StockLevel, StockTransfer } from '../domain/types';
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
  adjustStock: (productId: string, storeId: string, delta: number) => void;
  upsertGoodsReceipt: (receipt: GoodsReceipt) => void;
  upsertStockTransfer: (transfer: StockTransfer) => void;
  upsertStockCount: (count: StockCount) => void;
}

function upsertBy<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some((entry) => entry.id === item.id);
  return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stockLevels: seedStockLevels,
  goodsReceipts: seedGoodsReceipts,
  stockTransfers: seedStockTransfers,
  stockCounts: seedStockCounts,

  adjustStock: (productId, storeId, delta) =>
    set((state) => ({
      stockLevels: state.stockLevels.map((level) =>
        level.productId === productId && level.storeId === storeId
          ? { ...level, onHand: Math.max(0, level.onHand + delta) }
          : level,
      ),
    })),

  upsertGoodsReceipt: (receipt) =>
    set((state) => ({ goodsReceipts: upsertBy(state.goodsReceipts, receipt) })),

  upsertStockTransfer: (transfer) =>
    set((state) => ({ stockTransfers: upsertBy(state.stockTransfers, transfer) })),

  upsertStockCount: (count) => set((state) => ({ stockCounts: upsertBy(state.stockCounts, count) })),
}));
