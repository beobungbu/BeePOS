import type { StockLevel } from '../../domain/types';
import { createRng, randInt } from './prng';
import { products } from './products';
import { stores } from './stores';

const SEED = 20260911;

function buildStockLevels(): StockLevel[] {
  const rng = createRng(SEED + 4);
  const levels: StockLevel[] = [];
  for (const store of stores) {
    for (const product of products) {
      const minLevel = randInt(rng, 5, 20);
      const onHand = randInt(rng, 0, minLevel * 6);
      const reserved = onHand > 0 ? randInt(rng, 0, Math.min(5, onHand)) : 0;
      levels.push({ productId: product.id, storeId: store.id, onHand, reserved, minLevel });
    }
  }
  return levels;
}

export const stockLevels: StockLevel[] = buildStockLevels();
