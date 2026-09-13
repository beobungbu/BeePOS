/**
 * The cost curve behind the catalogue.
 *
 * One opening row per product (`source: 'seed'`), so every SKU has a weighted-average cost to
 * read rather than falling back to `Product.costPrice`, and then one row per line of every
 * received goods receipt, priced through the same weighted-average function the app uses when
 * a receipt is confirmed. A receipt that never landed writes no cost, which is the point of
 * only walking the received ones.
 */

import type { CostHistory } from '../../domain/types';
import { weightedAverageCost } from '../../domain/costing';
import { products } from './products';
import { stockLevels } from './stock';
import { goodsReceipts } from './operations';
import { daysAgo } from './clock';

/** The opening cost of the whole catalogue, dated before any receipt. */
const OPENING_DAYS_AGO = 45;

function buildCostHistory(): CostHistory[] {
  const rows: CostHistory[] = products.map((product) => ({
    productId: product.id,
    unitCost: product.costPrice,
    source: 'seed' as const,
    createdAt: daysAgo(OPENING_DAYS_AGO),
  }));

  /** Running cost and quantity per product and store, so each receipt blends into the last. */
  const running = new Map<string, { qty: number; unitCost: number }>();
  const onHandFor = (productId: string, storeId: string): number =>
    stockLevels.find((level) => level.productId === productId && level.storeId === storeId)?.onHand ?? 0;

  const received = goodsReceipts
    .filter((receipt) => receipt.status === 'received')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const receipt of received) {
    for (const line of receipt.lines) {
      const key = `${line.productId}|${receipt.storeId}`;
      const product = products.find((item) => item.id === line.productId);
      if (!product) continue;

      const previous = running.get(key) ?? {
        qty: onHandFor(line.productId, receipt.storeId),
        unitCost: product.costPrice,
      };
      // The incoming price is the receipt line's own cost, so every history row reconciles with
      // the document it came from (the cost tab shows both side by side).
      const unitCost = weightedAverageCost(previous, { qty: line.qty, unitCost: line.unitCost });

      running.set(key, { qty: previous.qty + line.qty, unitCost });
      rows.push({
        productId: line.productId,
        storeId: receipt.storeId,
        unitCost,
        source: 'receipt',
        refId: receipt.id,
        createdAt: new Date(receipt.createdAt),
      });
    }
  }

  return rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export const costHistory: CostHistory[] = buildCostHistory();
