import { availableQty, stockStatus, type StockStatus } from '../../domain/inventory';
import type { Product, StockLevel, Store } from '../../domain/types';

export interface StockRow {
  level: StockLevel;
  product: Product;
  store: Store;
  available: number;
  status: StockStatus;
}

export interface StoreScopeStats {
  skuCount: number;
  totalCostValue: number;
  lowCount: number;
  outCount: number;
}

/** Builds display rows for the given scope (a single store id, or 'all' stores). */
export function buildStockRows(
  stockLevels: readonly StockLevel[],
  products: readonly Product[],
  stores: readonly Store[],
  storeScope: string | 'all',
): StockRow[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  const storeById = new Map(stores.map((store) => [store.id, store]));

  return stockLevels
    .filter((level) => storeScope === 'all' || level.storeId === storeScope)
    .map((level) => {
      const product = productById.get(level.productId);
      const store = storeById.get(level.storeId);
      if (!product || !store) return null;
      return {
        level,
        product,
        store,
        available: availableQty(level),
        status: stockStatus(level),
      };
    })
    .filter((row): row is StockRow => row !== null);
}

/** Aggregate stats for the alert banner and Stat row. */
export function computeScopeStats(rows: readonly StockRow[]): StoreScopeStats {
  return rows.reduce<StoreScopeStats>(
    (stats, row) => ({
      skuCount: stats.skuCount + 1,
      totalCostValue: stats.totalCostValue + row.level.onHand * row.product.costPrice,
      lowCount: stats.lowCount + (row.status === 'low' ? 1 : 0),
      outCount: stats.outCount + (row.status === 'out' ? 1 : 0),
    }),
    { skuCount: 0, totalCostValue: 0, lowCount: 0, outCount: 0 },
  );
}
