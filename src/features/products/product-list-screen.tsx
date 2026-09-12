import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, Button, EmptyState, Pagination, Text, useToast } from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import type { Product } from '../../domain/types';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { ProductListCards } from './product-list-cards';
import {
  PRODUCTS_PAGE_SIZE,
  filterProducts,
  paginate,
  sortProducts,
  type ProductFilters,
  type ProductSortField,
  type SortDirection,
} from './product-list-utils';
import { ProductTable } from './product-table';
import { ProductToolbar } from './product-toolbar';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function ProductListScreen() {
  const t = useT();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const setProductActive = useCatalogStore((state) => state.setProductActive);
  const removeProduct = useCatalogStore((state) => state.removeProduct);
  const stockLevels = useInventoryStore((state) => state.stockLevels);

  const [filters, setFilters] = useState<ProductFilters>({ search: '', categoryId: 'all', status: 'all' });
  const [sortField, setSortField] = useState<ProductSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const filtered = useMemo(() => filterProducts(products, filters), [products, filters]);
  const sorted = useMemo(
    () => sortProducts(filtered, sortField, sortDirection, stockLevels),
    [filtered, sortField, sortDirection, stockLevels],
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PRODUCTS_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(() => paginate(sorted, currentPage, PRODUCTS_PAGE_SIZE), [sorted, currentPage]);

  function handleFiltersChange(next: ProductFilters) {
    setFilters(next);
    setPage(1);
  }

  function handleSortChange(field: ProductSortField) {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'ascending' ? 'descending' : 'ascending'));
    } else {
      setSortField(field);
      setSortDirection('ascending');
    }
  }

  function handleToggleActive(product: Product, isActive: boolean) {
    setProductActive(product.id, isActive);
    toast.show({ title: t('products.savedToast'), variant: 'success' });
  }

  function handleEdit(product: Product) {
    router.push(`/products/${product.id}`);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    removeProduct(pendingDelete.id);
    toast.show({ title: t('products.deletedToast'), variant: 'success' });
    setPendingDelete(null);
  }

  const hasAnyProducts = products.length > 0;
  const showEmpty = sorted.length === 0;

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <View className={isWide ? 'flex-row items-start justify-between gap-3' : 'gap-3'}>
          <View className={isWide ? 'min-w-0 flex-1' : 'min-w-0'}>
            <Text variant="title">{t('products.title')}</Text>
            <Text variant="caption" tone="muted">
              {`${sorted.length} ${t('products.countSuffix')}`}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Button variant="outline" onPress={() => router.push('/products/categories')}>
              {t('products.categories.title')}
            </Button>
            <Button onPress={() => router.push('/products/new')}>{t('products.addProduct')}</Button>
          </View>
        </View>

        <ProductToolbar filters={filters} categories={categories} onFiltersChange={handleFiltersChange} />

        {showEmpty ? (
          <EmptyState
            title={hasAnyProducts ? t('products.noResultsTitle') : t('products.emptyTitle')}
            description={hasAnyProducts ? t('products.noResultsDescription') : t('products.emptyDescription')}
          />
        ) : isWide ? (
          <ProductTable
            products={pageItems}
            categories={categories}
            breakpoint={breakpoint}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onToggleActive={handleToggleActive}
            onEdit={handleEdit}
            onDelete={setPendingDelete}
          />
        ) : (
          <ProductListCards products={pageItems} categories={categories} onSelect={handleEdit} />
        )}

        {!showEmpty && pageCount > 1 && (
          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        )}
      </View>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('products.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('products.deleteConfirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={confirmDelete}>{t('products.deleteConfirmAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollView>
  );
}
