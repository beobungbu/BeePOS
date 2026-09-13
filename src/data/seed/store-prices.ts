import type { StorePrice } from '../../domain/types';
import { products } from './products';
import { DEMO_ORG_ID } from './org';

/**
 * Per-store price overrides for the seeded chain.
 *
 * Fifteen products carry a branch price, in the two branches where a chain actually diverges:
 * Long Biên (`store-2`) prices up because it pays a delivery round, Bình Thạnh (`store-3`)
 * prices up further because it is the only southern shop the northern distributor reaches.
 * Hà Nội (`store-1`) and Đà Nẵng (`store-4`) stay on the chain price, so the product detail
 * table shows both states side by side and the sell screen has a branch whose tiles are
 * visibly not the catalogue price.
 *
 * The multipliers are deterministic, not random: the demo has to show the same numbers on
 * every boot, and a reviewer comparing two screenshots should not have to wonder whether the
 * price moved because of a bug.
 */

/** The branches that quote their own prices, and by how much above the chain price. */
const OVERRIDE_STORES: { storeId: string; multiplier: number }[] = [
  { storeId: 'store-2', multiplier: 1.06 },
  { storeId: 'store-3', multiplier: 1.12 },
];

/** How many products get a branch price. The first 15 SKUs span drinks and dairy. */
const OVERRIDE_PRODUCT_COUNT = 15;

/** Branch prices land on a round 500 đ, the way a shop actually writes a shelf label. */
function roundToLabel(amount: number): number {
  return Math.round(amount / 500) * 500;
}

function buildStorePrices(): StorePrice[] {
  const rows: StorePrice[] = [];
  for (const product of products.slice(0, OVERRIDE_PRODUCT_COUNT)) {
    for (const { storeId, multiplier } of OVERRIDE_STORES) {
      rows.push({
        orgId: DEMO_ORG_ID,
        storeId,
        productId: product.id,
        salePrice: roundToLabel(product.salePrice * multiplier),
      });
    }
  }
  return rows;
}

export const storePrices: StorePrice[] = buildStorePrices();
