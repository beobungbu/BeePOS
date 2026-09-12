import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, Button, EmptyState, Pagination, useToast } from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import type { Product } from '../../domain/types';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
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

  useScreenHeader({
    title: t('products.title'),
    subtitle: `${sorted.length} ${t('products.countSuffix')}`,
  });

  const hasAnyProducts = products.length > 0;
  const showEmpty = sorted.length === 0;

  const actions = (
    <>
      <Button variant="outline" onPress={() => router.push('/products/categories')}>
        {t('products.categories.title')}
      </Button>
      <Button onPress={() => router.push('/products/new')}>{t('products.addProduct')}</Button>
    </>
  );

  const toolbar = (
    <ProductToolbar
      actions={actions}
      filters={filters}
      categories={categories}
      onFiltersChange={handleFiltersChange}
    />
  );

  const list = (
    <>
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
    </>
  );

  // Desktop puts the toolbar in its own full-bleed row directly under the app header, so the
  // table starts as high as it can; below 1280 the page keeps one padded column.
  return (
    <ScrollView className="flex-1">
      {breakpoint === 'desktop' ? (
        <>
          <View className="border-b border-border bg-surface px-6">{toolbar}</View>
          <View className="flex-1 gap-4 px-6 py-4">{list}</View>
        </>
      ) : (
        <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
          {toolbar}
          {list}
        </View>
      )}

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
