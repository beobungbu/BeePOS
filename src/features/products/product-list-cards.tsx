import { ListGroup, ListItem, Text, VStack } from '@beemvp/beeui-ui';
import { formatVND } from '../../domain/money';
import type { Category, Product } from '../../domain/types';
import { useT } from '../../i18n';
import { useInventoryStore } from '../../data/inventory-store';
import { ProductThumb } from './components/product-thumb';
import { StockBadge } from './components/stock-badge';
import { totalMinLevel, totalStock } from './product-list-utils';

interface ProductListCardsProps {
  products: Product[];
  categories: Category[];
  onSelect: (product: Product) => void;
}

/**
 * Phone list rows, the three-line format of `docs/design/design-direction.md` section 8:
 * name with the price on the first line, SKU and category on the second, stock badge
 * trailing. Status is a read-only badge (not a Switch) to avoid nesting a second
 * interactive control inside the row's own pressable (see findings-02, nested interactive
 * controls in a pressable row reproduce the web hydration issue of findings-00-05).
 * Editing status happens on the product form, which has a Switch outside any pressable row.
 */
export function ProductListCards({ products, categories, onSelect }: ProductListCardsProps) {
  const t = useT();
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const categoryName = (categoryId: string) =>
    categories.find((category) => category.id === categoryId)?.name ?? '';

  return (
    <ListGroup>
      {products.map((product) => (
        <ListItem
          key={product.id}
          title={product.name}
          description={`${product.sku} · ${categoryName(product.categoryId)}`}
          onPress={() => onSelect(product)}
          leading={
            <ProductThumb name={product.name} categoryId={product.categoryId} imageUrl={product.imageUrl} />
          }
          trailing={
            <VStack gap="xs" align="end">
              <Text variant="label" numeric="tabular" className="font-bold">
                {formatVND(product.salePrice)}
              </Text>
              <StockBadge
                quantity={totalStock(product.id, stockLevels)}
                minLevel={totalMinLevel(product.id, stockLevels)}
              />
            </VStack>
          }
          accessibilityLabel={`${product.name}, ${formatVND(product.salePrice)}, ${
            product.isActive ? t('products.statusActive') : t('products.statusInactive')
          }`}
        />
      ))}
    </ListGroup>
  );
}
