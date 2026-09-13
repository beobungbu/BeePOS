import { useMemo } from 'react';
import { create } from 'zustand';
import type { GoodsReceipt, Supplier } from '../domain/types';
import { receiptTotals } from '../domain/inventory';
import { suppliers as seedSuppliers } from './seed';
import { useInventoryStore } from './inventory-store';
import { useSessionStore } from './session-store';

interface SupplierState {
  suppliers: Supplier[];
  upsertSupplier: (supplier: Supplier) => void;
  setSupplierActive: (supplierId: string, isActive: boolean) => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: seedSuppliers,

  upsertSupplier: (supplier) =>
    set((state) => ({
      suppliers: state.suppliers.some((item) => item.id === supplier.id)
        ? state.suppliers.map((item) => (item.id === supplier.id ? supplier : item))
        : [...state.suppliers, supplier],
    })),

  setSupplierActive: (supplierId, isActive) =>
    set((state) => ({
      suppliers: state.suppliers.map((item) =>
        item.id === supplierId ? { ...item, isActive } : item,
      ),
    })),
}));

/** Id for a supplier created in the app; the seeded ones keep their readable ids. */
export function makeSupplierId(): string {
  return `supplier-${Date.now()}`;
}

/** The chain's suppliers, in name order, scoped to the signed-in chain. */
export function useSuppliers(): Supplier[] {
  const suppliers = useSupplierStore((state) => state.suppliers);
  const orgId = useSessionStore((state) => state.session?.orgId);
  return useMemo(() => {
    const scoped = orgId ? suppliers.filter((supplier) => supplier.orgId === orgId) : suppliers;
    return scoped.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [suppliers, orgId]);
}

export interface SupplierPurchaseHistory {
  receipts: GoodsReceipt[];
  receiptCount: number;
  totalCost: number;
  /** ISO timestamp of the most recent receipt, or undefined when there is none. */
  lastReceivedAt?: string;
}

/** Receipts booked against a supplier, newest first, with the two figures the list shows. */
export function purchaseHistoryFor(
  receipts: readonly GoodsReceipt[],
  supplierId: string,
): SupplierPurchaseHistory {
  const own = receipts
    .filter((receipt) => receipt.supplierId === supplierId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    receipts: own,
    receiptCount: own.length,
    totalCost: own.reduce((total, receipt) => total + receiptTotals(receipt.lines).totalCost, 0),
    lastReceivedAt: own[0]?.createdAt,
  };
}

/** Hook form, so a list can show every supplier's purchase figures without re-scanning. */
export function useSupplierHistories(): Map<string, SupplierPurchaseHistory> {
  const receipts = useInventoryStore((state) => state.goodsReceipts);
  const suppliers = useSuppliers();
  return useMemo(() => {
    const index = new Map<string, SupplierPurchaseHistory>();
    for (const supplier of suppliers) index.set(supplier.id, purchaseHistoryFor(receipts, supplier.id));
    return index;
  }, [receipts, suppliers]);
}
