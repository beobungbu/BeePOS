import { FlatList, View } from 'react-native';
import { EmptyState } from '@beemvp/beeui-ui';
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
  lines,
  onAddProduct,
}: ProductGridProps) {
  const t = useT();

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
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: gutter, gap }}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      renderItem={({ item }) => {
        const stock = stockLevels.find((level) => level.productId === item.id && level.storeId === storeId);
        const inCart = lines.find((line) => line.productId === item.id)?.qty ?? 0;
        return (
          // `flex: 1 / columns`, not `flex-1`: a last row (or a filtered result) holding one
          // item would otherwise stretch that tile across the full grid width.
          <View style={{ flex: 1 / columns }}>
            <ProductCard
              product={item}
              stock={stock}
              inCart={inCart}
              imageAspectRatio={imageAspectRatio}
              onAdd={() => onAddProduct(item)}
            />
          </View>
        );
      }}
    />
  );
}
