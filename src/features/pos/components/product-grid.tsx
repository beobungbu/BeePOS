import { FlatList, View } from 'react-native';
import { EmptyState } from '@beemvp/beeui-ui';
import type { Product, StockLevel } from '../../../domain/types';
import { useT } from '../../../i18n';
import { ProductCard } from './product-card';

interface ProductGridProps {
  products: Product[];
  stockLevels: StockLevel[];
  storeId: string;
  columns: number;
  onAddProduct: (product: Product) => void;
}

export function ProductGrid({ products, stockLevels, storeId, columns, onAddProduct }: ProductGridProps) {
  const t = useT();

  if (products.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <EmptyState title={t('pos.title')} description={t('pos.barcodeNotFound')} />
      </View>
    );
  }

  return (
    <FlatList
      key={columns}
      data={products}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12, gap: 12 }}
      columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      renderItem={({ item }) => {
        const stock = stockLevels.find((level) => level.productId === item.id && level.storeId === storeId);
        return (
          <View className="flex-1">
            <ProductCard product={item} stock={stock} onAdd={() => onAddProduct(item)} />
          </View>
        );
      }}
    />
  );
}
