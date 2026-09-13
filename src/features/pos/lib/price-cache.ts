/**
 * A memo in front of `resolvePrice` for the sell grid.
 *
 * `quoteFor` is called from `ProductGrid`'s `renderItem`, so the precedence engine used to
 * walk the price-rule and promotion arrays once per visible tile per commit, and a scroll is
 * nothing but commits: four to seven frames over 100 ms at 120 SKUs as well as at 1000
 * (`reports/w-e-e2e-perf-report.md` 5.6). The answer only changes when one of its inputs
 * does, so it is cached here and the whole cache is dropped when any of them moves.
 *
 * What the key holds is exactly what the engine reads: the branch, the channel, the buyer and
 * their group, the product, the selling unit and the quantity. **The quantity is the bucket
 * itself**: tier thresholds are data, so rounding the quantity into coarser buckets would
 * quote a tier the order has not cleared. Tiles always ask about one unit, which is where the
 * hit rate comes from.
 *
 * Invalidated wholesale rather than per entry: the stores that feed it change when somebody
 * edits a price list, a promotion or a branch price, which is rare and never inside a frame,
 * while working out which cached quotes an edited rule touches is the kind of bookkeeping
 * that silently serves a stale price.
 */

import { resolvePrice, type PriceResolution, type PricingContext } from '../../../domain/pricing';
import type { OrderChannel, Product } from '../../../domain/types';
import { useCatalogStore } from '../../../data/catalog-store';
import { useCustomerStore } from '../../../data/customer-store';
import { usePricingStore } from '../../../data/pricing-store';
import { useStorePriceStore } from '../../../data/store-price-store';

/** Everything about the quote that is not the product, the unit or the quantity. */
export interface PriceCacheScope {
  storeId?: string;
  channel: OrderChannel;
  customerId?: string;
  groupId?: string;
}

/**
 * Ceiling on cached quotes. A thousand products across a handful of units and quantities fits
 * inside it; past it the cache is dropped rather than grown without limit, because a till left
 * open all day would otherwise hold every quantity every line has ever been at.
 */
const MAX_ENTRIES = 4000;

/** A promotion window opens and closes on the clock, so a quote is only good for its minute. */
const BUCKET_MS = 60_000;

const cache = new Map<string, PriceResolution>();
let bucket = -1;

/** Drops every cached quote. Called on any pricing input change, and by the tests. */
export function invalidatePriceCache(): void {
  cache.clear();
}

/** Cached entries, for the perf harness and the tests that assert the memo actually memoises. */
export function priceCacheSize(): number {
  return cache.size;
}

let subscribed = false;

/**
 * Subscribes the cache to every store the engine reads. Done on first use rather than at
 * import so a module that only pulls the types along does not register a listener.
 */
function subscribeOnce(): void {
  if (subscribed) return;
  subscribed = true;
  usePricingStore.subscribe(invalidatePriceCache);
  useStorePriceStore.subscribe(invalidatePriceCache);
  useCatalogStore.subscribe(invalidatePriceCache);
  // The buyer's group is part of the key, but the group a buyer belongs to is edited on the
  // customer record, so a group move has to drop the quotes made under the old one.
  useCustomerStore.subscribe(invalidatePriceCache);
}

function keyOf(
  scope: PriceCacheScope,
  productId: string,
  qty: number,
  unit: string | undefined,
): string {
  return [
    scope.storeId ?? '',
    scope.channel,
    scope.customerId ?? '',
    scope.groupId ?? '',
    productId,
    unit ?? '',
    qty,
  ].join('|');
}

/**
 * `resolvePrice` with the memo in front of it. The context must be built from the same inputs
 * the scope names, which is what `useWholesalePricing` does at the one call site.
 */
export function cachedResolvePrice(
  scope: PriceCacheScope,
  product: Product,
  qty: number,
  unit: string | undefined,
  context: PricingContext,
): PriceResolution {
  subscribeOnce();

  const now = Math.floor(Date.now() / BUCKET_MS);
  if (now !== bucket) {
    bucket = now;
    cache.clear();
  }

  const key = keyOf(scope, product.id, qty, unit);
  const hit = cache.get(key);
  if (hit) return hit;

  const resolution = resolvePrice(product, qty, unit, context);
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(key, resolution);
  return resolution;
}
