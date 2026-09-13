import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { EmptyState } from '@beemvp/beeui-ui';
import { effectivePrice } from '../../../domain/catalog';
import type { CartLine, Product, StockLevel } from '../../../domain/types';
import { useT } from '../../../i18n';
import { ProductCard } from './product-card';

interface ProductGridProps {
  products: Product[];
  stockLevels: StockLevel[];
  storeId: string;
  columns: number;
  /** Page gutter and grid gap for the current band, in points. */
  gutter: number;
  gap: number;
  imageAspectRatio: number;
  /** Small type step for the 3 column phone grid. */
  compactTiles?: boolean;
  /** Per-store price overrides, indexed; the grid prices every tile through it. */
  storePrices: ReadonlyMap<string, number>;
  lines: CartLine[];
  onAddProduct: (product: Product) => void;
}

export function ProductGrid({
  products,
  stockLevels,
  storeId,
  columns,
  gutter,
  gap,
  imageAspectRatio,
  compactTiles = false,
  storePrices,
  lines,
  onAddProduct,
}: ProductGridProps) {
  const t = useT();

  // Indexed once per data change instead of scanned per tile. `renderItem` runs for every
  // visible cell on every scroll frame, so the two `find` calls that used to sit inside it
  // made the grid cost `tiles x stockLevels` per frame, which is what the thousand-product
  // catalogue of the perf harness turns into dropped frames.
  const stockByProductId = useMemo(() => {
    const index = new Map<string, StockLevel>();
    for (const level of stockLevels) {
      if (level.storeId === storeId) index.set(level.productId, level);
    }
    return index;
  }, [stockLevels, storeId]);

  // First line wins, as the `find` it replaces did; the cart keys its lines by product, so
  // there is never a second one to disagree with.
  const qtyByProductId = useMemo(() => {
    const index = new Map<string, number>();
    for (const line of lines) if (!index.has(line.productId)) index.set(line.productId, line.qty);
    return index;
  }, [lines]);

  if (products.length === 0) {
    return (
      <View className="flex-1 items-start bg-surface-muted px-6 pt-12">
        <View className="w-full max-w-[280px] self-center">
          <EmptyState title={t('pos.emptyCatalogTitle')} description={t('pos.emptyCatalogDescription')} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      key={columns}
      className="bg-surface-muted"
      data={products}
      numColumns={columns}
      // Window the list: the default batching commits 10 rows (50 tiles) per pass, which drops
      // frames past 400 products. Four rows per batch and a 7-screen window keep p95 under 17 ms
      // at 1000 products (measured in the /audit/perf harness).
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={7}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: gutter, gap }}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      renderItem={({ item }) => {
        const stock = stockByProductId.get(item.id);
        const inCart = qtyByProductId.get(item.id) ?? 0;
        return (
          // `flex: 1 / columns`, not `flex-1`: a last row (or a filtered result) holding one
          // item would otherwise stretch that tile across the full grid width.
          <View style={{ flex: 1 / columns }}>
            <ProductCard
              product={item}
              price={effectivePrice(item, storeId, storePrices)}
              stock={stock}
              inCart={inCart}
              imageAspectRatio={imageAspectRatio}
              compact={compactTiles}
              onAdd={() => onAddProduct(item)}
            />
          </View>
        );
      }}
    />
  );
}
