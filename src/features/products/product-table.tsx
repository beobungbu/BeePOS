import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { View } from 'react-native';
import { formatVND } from '../../domain/money';
import type { Category, Product } from '../../domain/types';
import { useT } from '../../i18n';
import { totalStock } from './product-list-utils';
import type { ProductSortField, SortDirection } from './product-list-utils';
import { useInventoryStore } from '../../data/inventory-store';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
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
  sortField,
  sortDirection,
  onSortChange,
  onToggleActive,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const t = useT();
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
          <TableHead
            label={t('products.columns.sku')}
            sortDirection={directionFor('sku', sortField, sortDirection)}
            onSortChange={() => onSortChange('sku')}
          >
            {t('products.columns.sku')}
          </TableHead>
          <TableHead label={t('products.columns.category')}>{t('products.columns.category')}</TableHead>
          <TableHead label={t('products.columns.unit')}>{t('products.columns.unit')}</TableHead>
          <TableHead
            label={t('products.columns.cost')}
            sortDirection={directionFor('cost', sortField, sortDirection)}
            onSortChange={() => onSortChange('cost')}
          >
            {t('products.columns.cost')}
          </TableHead>
          <TableHead
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
              <Text>{product.name}</Text>
            </TableCell>
            <TableCell label={t('products.columns.sku')}>
              <Text tone="muted">{product.sku}</Text>
            </TableCell>
            <TableCell label={t('products.columns.category')}>
              <Text tone="muted">{categoryName(product.categoryId)}</Text>
            </TableCell>
            <TableCell label={t('products.columns.unit')}>
              <Text tone="muted">{product.unit}</Text>
            </TableCell>
            <TableCell label={t('products.columns.cost')}>
              <Text>{formatVND(product.costPrice)}</Text>
            </TableCell>
            <TableCell label={t('products.columns.sale')}>
              <Text>{formatVND(product.salePrice)}</Text>
            </TableCell>
            <TableCell label={t('products.columns.stock')}>
              <Text>{totalStock(product.id, stockLevels)}</Text>
            </TableCell>
            <TableCell label={t('products.columns.status')}>
              <Switch
                value={product.isActive}
                onValueChange={(value) => onToggleActive(product, value)}
                accessibilityLabel={product.name}
              />
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
