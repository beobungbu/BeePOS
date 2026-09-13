import type { GoodsReceipt, StockCount, StockTransfer } from '../../domain/types';
import { createRng, pickMany, randInt } from './prng';
import { products } from './products';
import { stores } from './stores';
import { suppliers } from './suppliers';
import { DEMO_ORG_ID } from './org';

const SEED = 20260911;
const NOW = new Date('2026-09-11T09:00:00.000Z');

function daysAgoIso(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

/**
 * Six receipts across three branches, every one booked against a real supplier record, which
 * is now the only way a receipt can be booked: the display name is read off the `Supplier`
 * record rather than copied onto the receipt. Two receipts per branch means a supplier detail
 * pane has more than one row to show.
 */
function buildGoodsReceipts(): GoodsReceipt[] {
  const rng = createRng(SEED + 8);
  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive);
  const statuses = ['draft', 'received', 'received', 'received'] as const;

  return stores.slice(0, 3).flatMap((store, storeIndex) =>
    [0, 1].map((pass) => {
      const index = storeIndex * 2 + pass;
      const supplier = activeSuppliers[index % activeSuppliers.length];
      const lines = pickMany(rng, products, randInt(rng, 4, 8)).map((product) => ({
        productId: product.id,
        qty: randInt(rng, 10, 100),
        unitCost: product.costPrice,
      }));
      return {
        id: `receipt-${index + 1}`,
        orgId: DEMO_ORG_ID,
        storeId: store.id,
        supplierId: supplier.id,
        lines,
        status: statuses[randInt(rng, 0, statuses.length - 1)],
        createdAt: daysAgoIso(randInt(rng, 1, 20)),
      };
    }),
  );
}

function buildStockTransfers(): StockTransfer[] {
  const rng = createRng(SEED + 9);
  const statuses = ['draft', 'sent', 'received'] as const;
  const pairs: Array<[string, string]> = [
    ['store-1', 'store-2'],
    ['store-3', 'store-4'],
    ['store-2', 'store-3'],
  ];

  return pairs.map(([fromStoreId, toStoreId], index) => {
    const lines = pickMany(rng, products, randInt(rng, 3, 6)).map((product) => ({
      productId: product.id,
      qty: randInt(rng, 5, 40),
      unitCost: product.costPrice,
    }));
    return {
      id: `transfer-${index + 1}`,
      orgId: DEMO_ORG_ID,
      fromStoreId,
      toStoreId,
      lines,
      status: statuses[index % statuses.length],
      createdAt: daysAgoIso(randInt(rng, 1, 15)),
    };
  });
}

function buildStockCounts(): StockCount[] {
  const rng = createRng(SEED + 10);
  const statuses = ['draft', 'posted'] as const;

  return stores.map((store, index) => {
    const lines = pickMany(rng, products, randInt(rng, 6, 12)).map((product) => {
      const expected = randInt(rng, 0, 80);
      const variance = randInt(rng, -5, 5);
      return { productId: product.id, expected, counted: Math.max(0, expected + variance) };
    });
    return {
      id: `count-${index + 1}`,
      orgId: DEMO_ORG_ID,
      storeId: store.id,
      lines,
      status: statuses[index % statuses.length],
      createdAt: daysAgoIso(randInt(rng, 1, 10)),
    };
  });
}

export const goodsReceipts: GoodsReceipt[] = buildGoodsReceipts();
export const stockTransfers: StockTransfer[] = buildStockTransfers();
export const stockCounts: StockCount[] = buildStockCounts();
