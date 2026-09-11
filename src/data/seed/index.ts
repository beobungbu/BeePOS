/**
 * Deterministic seeded mock data for BeePOS. Every array is generated from a fixed
 * PRNG seed, so reloading the app always produces the same catalog, stock, and history.
 * No network calls, no faker library. Split by entity to keep each file small and reviewable.
 */

export { stores } from './stores';
export { staff } from './staff';
export { categories } from './categories';
export { products } from './products';
export { stockLevels } from './stock';
export { customers } from './customers';
export { orders, shifts } from './orders';
export { goodsReceipts, stockTransfers, stockCounts } from './operations';
