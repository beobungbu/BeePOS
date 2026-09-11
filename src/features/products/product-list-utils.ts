import type { Product, StockLevel } from '../../domain/types';

export type ProductStatusFilter = 'all' | 'active' | 'inactive';
export type ProductSortField = 'name' | 'sku' | 'cost' | 'sale' | 'stock';
export type SortDirection = 'ascending' | 'descending' | 'none';

export interface ProductFilters {
  search: string;
  categoryId: string | 'all';
  status: ProductStatusFilter;
}

export const PRODUCTS_PAGE_SIZE = 20;

/** Total on-hand quantity for a product across every store. */
export function totalStock(productId: string, stockLevels: readonly StockLevel[]): number {
  return stockLevels.reduce(
    (total, level) => (level.productId === productId ? total + level.onHand : total),
    0,
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Applies the search/category/status toolbar filters to the catalog. */
export function filterProducts(products: readonly Product[], filters: ProductFilters): Product[] {
  const query = normalize(filters.search);
  return products.filter((product) => {
    if (filters.categoryId !== 'all' && product.categoryId !== filters.categoryId) return false;
    if (filters.status === 'active' && !product.isActive) return false;
    if (filters.status === 'inactive' && product.isActive) return false;
    if (!query) return true;
    return (
      normalize(product.name).includes(query) ||
      normalize(product.sku).includes(query) ||
      product.barcode.includes(query)
    );
  });
}

/** Sorts by the given column; direction 'none' falls back to the catalog's natural order. */
export function sortProducts(
  products: readonly Product[],
  field: ProductSortField,
  direction: SortDirection,
  stockLevels: readonly StockLevel[],
): Product[] {
  if (direction === 'none') return [...products];
  const factor = direction === 'ascending' ? 1 : -1;
  const valueOf = (product: Product): string | number => {
    switch (field) {
      case 'name':
        return product.name;
      case 'sku':
        return product.sku;
      case 'cost':
        return product.costPrice;
      case 'sale':
        return product.salePrice;
      case 'stock':
        return totalStock(product.id, stockLevels);
      default:
        return '';
    }
  };
  return [...products].sort((a, b) => {
    const left = valueOf(a);
    const right = valueOf(b);
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
    return String(left).localeCompare(String(right)) * factor;
  });
}

/** Slices a list to one page (1-based) of the given page size. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
