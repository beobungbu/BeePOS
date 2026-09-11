import { Badge, ListGroup, ListItem } from '@beemvp/beeui-ui';
import { formatVND } from '../../domain/money';
import type { Category, Product } from '../../domain/types';
import { useT } from '../../i18n';
import { useInventoryStore } from '../../data/inventory-store';
import { totalStock } from './product-list-utils';

interface ProductListCardsProps {
  products: Product[];
  categories: Category[];
  onSelect: (product: Product) => void;
}

/**
 * Mobile card list. Status is shown as a read-only Badge (not a Switch) to avoid nesting
 * a second interactive control inside the row's own pressable (see findings-02, nested
 * interactive controls in a pressable row reproduce the same web hydration issue as
 * findings-00-05's DropdownMenuTrigger/IconButton case). Editing status happens on the
 * product detail screen, which has a dedicated Switch outside any pressable row.
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
          description={`${product.sku} · ${categoryName(product.categoryId)} · ${formatVND(product.salePrice)}`}
          onPress={() => onSelect(product)}
          leading={<Badge variant="outline">{totalStock(product.id, stockLevels)}</Badge>}
          trailing={
            <Badge variant={product.isActive ? 'success' : 'outline'}>
              {product.isActive ? t('products.statusActive') : t('products.statusInactive')}
            </Badge>
          }
        />
      ))}
    </ListGroup>
  );
}
