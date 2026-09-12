import { stockLabel } from '../stock-label';

// The tile's pill and the tile's accessibility label read the same words, so the thresholds
// live in one place; these cases pin the three states and the boundary between them.
const t = (key: string) => key;

describe('stockLabel', () => {
  it('reports out of stock at zero and below', () => {
    expect(stockLabel(t, 0, 5)).toBe('pos.stockOut');
    expect(stockLabel(t, -3, 5)).toBe('pos.stockOut');
  });

  it('reports low stock at and under the minimum level', () => {
    expect(stockLabel(t, 5, 5)).toBe('pos.stockLow 5');
    expect(stockLabel(t, 1, 5)).toBe('pos.stockLow 1');
  });

  it('reports the count on hand above the minimum level', () => {
    expect(stockLabel(t, 6, 5)).toBe('pos.stockOnHand 6');
  });

  it('treats a product with no minimum level as simply in stock', () => {
    expect(stockLabel(t, 12, 0)).toBe('pos.stockOnHand 12');
  });
});
