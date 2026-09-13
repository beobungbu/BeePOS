/**
 * Lots and expiry dates for the ten SKUs flagged `trackLots`.
 *
 * Three batches each at the two northern branches, deliberately spread across the states the
 * expiring report has to tell apart: one already past its date, one inside the 30-day warning
 * window and one comfortably ahead. That also gives the FEFO picker something to sort, since
 * the oldest batch is never the first one in the array.
 */

import type { Lot } from '../../domain/types';
import { products } from './products';
import { DEMO_ORG_ID } from './org';
import { createRng, randInt } from './prng';
import { daysAgo, daysAhead } from './clock';

const SEED = 20260911;

/** Branches that hold lot-tracked stock. The two southern shops buy short-dated goods daily. */
const LOT_STORE_IDS = ['store-1', 'store-2'];

/**
 * Days from the seed instant to each batch's expiry. Negative is already expired; the middle
 * one sits inside the warning window on purpose.
 */
const EXPIRY_OFFSETS = [-6, 12, 95];

function buildLots(): Lot[] {
  const rng = createRng(SEED + 30);
  const tracked = products.filter((product) => product.trackLots);
  const lots: Lot[] = [];

  for (const product of tracked) {
    for (const storeId of LOT_STORE_IDS) {
      EXPIRY_OFFSETS.forEach((offset, batch) => {
        const received = offset < 0 ? daysAgo(60 + batch * 5) : daysAgo(20 - batch * 5);
        lots.push({
          id: `lot-${product.id}-${storeId}-${batch + 1}`,
          orgId: DEMO_ORG_ID,
          storeId,
          productId: product.id,
          // Batch code the way a Vietnamese manufacturer prints it: date received, then a run.
          lotCode: `L${received.toISOString().slice(2, 10).replace(/-/g, '')}-${batch + 1}`,
          expiresAt: offset < 0 ? daysAgo(-offset) : daysAhead(offset),
          // An expired batch is nearly sold through; a fresh one is not.
          onHand: offset < 0 ? randInt(rng, 1, 6) : randInt(rng, 8, 40),
        });
      });
    }
  }

  return lots;
}

export const lots: Lot[] = buildLots();
