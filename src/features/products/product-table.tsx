import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { Pressable, View } from 'react-native';
import { formatVND } from '../../domain/money';
import type { Category, Product } from '../../domain/types';
import type { Breakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { ProductThumb } from '../../components/product-thumb';
import { StockBadge } from './components/stock-badge';
import { totalMinLevel, totalStock } from './product-list-utils';
import type { ProductSortField, SortDirection } from './product-list-utils';
import { useInventoryStore } from '../../data/inventory-store';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  /**
   * Column set by band: desktop shows all eight; at 768 the SKU, category and cost columns
   * are dropped and the SKU folds under the product name, because eight columns there means
   * a three-line product name and a wrapped SKU (direction doc section 8: fold or drop,
   * never clip).
   */
  breakpoint: Breakpoint;
  sortField: ProductSortField;
  sortDirection: SortDirection;
  onSortChange: (field: ProductSortField) => void;
  onToggleActive: (product: Product, isActive: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function directionFor(field: ProductSortField, current: ProductSortField, direction: SortDirection): SortDirection {
  return field === current ? direction : 'none';
}

export function ProductTable({
  products,
  categories,
  breakpoint,
  sortField,
  sortDirection,
  onSortChange,
  onToggleActive,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const t = useT();
  const isDesktop = breakpoint === 'desktop';
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const categoryName = (categoryId: string) =>
    categories.find((category) => category.id === categoryId)?.name ?? '';

  return (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead
            label={t('products.columns.product')}
            sortDirection={directionFor('name', sortField, sortDirection)}
            onSortChange={() => onSortChange('name')}
          >
            {t('products.columns.product')}
          </TableHead>
          {isDesktop && (
            <TableHead
              label={t('products.columns.sku')}
              sortDirection={directionFor('sku', sortField, sortDirection)}
              onSortChange={() => onSortChange('sku')}
            >
              {t('products.columns.sku')}
            </TableHead>
          )}
          {isDesktop && (
            <TableHead label={t('products.columns.category')}>{t('products.columns.category')}</TableHead>
          )}
          {isDesktop && (
            <TableHead
              className="items-end text-right"
              label={t('products.columns.cost')}
              sortDirection={directionFor('cost', sortField, sortDirection)}
              onSortChange={() => onSortChange('cost')}
            >
              {t('products.columns.cost')}
            </TableHead>
          )}
          <TableHead
            className="items-end text-right"
            label={t('products.columns.sale')}
            sortDirection={directionFor('sale', sortField, sortDirection)}
            onSortChange={() => onSortChange('sale')}
          >
            {t('products.columns.sale')}
          </TableHead>
          <TableHead
            label={t('products.columns.stock')}
            sortDirection={directionFor('stock', sortField, sortDirection)}
            onSortChange={() => onSortChange('stock')}
          >
            {t('products.columns.stock')}
          </TableHead>
          <TableHead label={t('products.columns.status')}>{t('products.columns.status')}</TableHead>
          <TableHead label={t('products.columns.actions')}>{t('products.columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell label={t('products.columns.product')}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={product.name}
                onPress={() => onEdit(product)}
                className="min-h-11 flex-row items-center gap-3"
              >
                <ProductThumb name={product.name} categoryId={product.categoryId} imageUrl={product.imageUrl} />
                <View className="min-w-0 flex-1">
                  <Text variant="label" className="font-semibold" numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text variant="caption" tone="muted" numeric="tabular">
                    {isDesktop ? product.unit : `${product.sku} · ${categoryName(product.categoryId)} · ${product.unit}`}
                  </Text>
                </View>
              </Pressable>
            </TableCell>
            {isDesktop && (
              <TableCell label={t('products.columns.sku')}>
                <Text variant="caption" tone="muted" numeric="tabular">
                  {product.sku}
                </Text>
              </TableCell>
            )}
            {isDesktop && (
              <TableCell label={t('products.columns.category')}>
                <Text tone="muted" variant="label">
                  {categoryName(product.categoryId)}
                </Text>
              </TableCell>
            )}
            {isDesktop && (
              <TableCell label={t('products.columns.cost')} className="items-end text-right">
                <Text variant="label" tone="muted" numeric="tabular" className="w-full text-right">
                  {formatVND(product.costPrice)}
                </Text>
              </TableCell>
            )}
            <TableCell label={t('products.columns.sale')} className="items-end text-right">
              <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                {formatVND(product.salePrice)}
              </Text>
            </TableCell>
            <TableCell label={t('products.columns.stock')}>
              {/* A row makes the badge hug its text; a bare cell child stretches to the column. */}
              <View className="flex-row">
                <StockBadge
                  quantity={totalStock(product.id, stockLevels)}
                  minLevel={totalMinLevel(product.id, stockLevels)}
                />
              </View>
            </TableCell>
            <TableCell label={t('products.columns.status')}>
              <View className="flex-row">
                <StatusBadge
                  isActive={product.isActive}
                  activeLabel={t('products.statusActive')}
                  inactiveLabel={t('products.statusInactive')}
                />
              </View>
            </TableCell>
            <TableCell label={t('products.columns.actions')}>
              <View>
                <DropdownMenu>
                  <DropdownMenuTrigger variant="outline" size="sm">
                    {t('products.columns.actions')}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => onEdit(product)}>{t('products.actionsEdit')}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onToggleActive(product, !product.isActive)}>
                      {product.isActive ? t('products.actionsDeactivate') : t('products.actionsActivate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete(product)}>
                      {t('products.actionsDelete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </View>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function StatusBadge({ isActive, activeLabel, inactiveLabel }: { isActive: boolean; activeLabel: string; inactiveLabel: string }) {
  return <Badge variant={isActive ? 'success' : 'outline'}>{isActive ? activeLabel : inactiveLabel}</Badge>;
}
