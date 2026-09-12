import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '@beemvp/beeui-ui';
import type { Product } from '../../domain/types';
import { useT } from '../../i18n';
import { useActiveCart, useCartStore } from '../../data/cart-store';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift } from '../../data/shift-store';
import { CartPanel } from './components/cart-panel';
import { CatalogSearch } from './components/catalog-search';
import { ALL_CATEGORY, CategoryChips } from './components/category-chips';
import { FloatingCartBar } from './components/floating-cart-bar';
import { NoShiftBanner } from './components/no-shift-banner';
import { OrderTabStrip } from './components/order-tab-strip';
import { ProductGrid } from './components/product-grid';
import { usePosLayout } from './hooks/use-pos-layout';
import { cartTotalsOf, cartLineCount, cartUnitCount } from './lib/cart-totals';
import { orderLabel } from './lib/order-label';

export default function PosScreen() {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const layout = usePosLayout();

  const store = useSessionStore((state) => state.store);
  const currentShift = useCurrentShift();
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const customers = useCustomerStore((state) => state.customers);
  const cart = useActiveCart();
  const ensureStore = useCartStore((state) => state.ensureStore);
  const addProduct = useCartStore((state) => state.addProduct);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORY);

  useEffect(() => {
    if (store) ensureStore(store.id);
  }, [store, ensureStore]);

  const activeProducts = useMemo(() => products.filter((product) => product.isActive), [products]);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activeProducts.filter((product) => {
      const matchesCategory = category === ALL_CATEGORY || product.categoryId === category;
      if (!matchesCategory) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.sku.toLowerCase().includes(needle) ||
        product.barcode.includes(needle)
      );
    });
  }, [activeProducts, category, query]);

  function handleAddProduct(product: Product) {
    addProduct(product.id, product.salePrice);
    toast.show({ title: t('pos.addedToCart'), description: product.name, variant: 'success', duration: 1500 });
  }

  function handleBarcodeSubmit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const match = activeProducts.find((product) => product.barcode === trimmed);
    if (match) {
      handleAddProduct(match);
      setQuery('');
    } else if (trimmed.length >= 8) {
      // Only treat long numeric-looking input as a barcode scan attempt; short queries just filter.
      toast.show({ title: t('pos.barcodeNotFound'), variant: 'destructive', duration: 2000 });
    }
  }

  const totals = cartTotalsOf(cart, activeProducts);
  const customerName = customers.find((item) => item.id === cart.customerId)?.name;

  return (
    <View className="flex-1 flex-row">
      <View className="min-w-0 flex-1">
        <OrderTabStrip products={activeProducts} />
        {currentShift ? null : (
          <NoShiftBanner gutter={layout.gutter} verbose={layout.breakpoint !== 'phone'} />
        )}

        <View className="gap-2.5 border-b border-border bg-surface pb-2.5 pt-3">
          <View style={{ paddingHorizontal: layout.gutter }}>
            <CatalogSearch
              value={query}
              onChangeText={setQuery}
              onSubmit={handleBarcodeSubmit}
              short={layout.shortSearchPlaceholder}
              showKeyHint={layout.breakpoint === 'desktop'}
            />
          </View>
          <View style={layout.breakpoint === 'phone' ? undefined : { paddingHorizontal: layout.gutter }}>
            <CategoryChips
              categories={categories}
              value={category}
              onChange={setCategory}
              scroll={layout.breakpoint !== 'tablet'}
              showScrollControl={layout.breakpoint === 'desktop'}
              visibleLimit={layout.chipLimit}
              gutter={layout.gutter}
            />
          </View>
        </View>

        <ProductGrid
          products={filteredProducts}
          stockLevels={stockLevels}
          storeId={store?.id ?? ''}
          columns={layout.gridColumns}
          gutter={layout.gutter}
          gap={layout.gap}
          imageAspectRatio={layout.imageAspectRatio}
          compactTiles={layout.compactTiles}
          lines={cart.lines}
          onAddProduct={handleAddProduct}
        />

        {layout.isCartPaneVisible ? null : (
          <FloatingCartBar
            orderLabel={orderLabel(t, cart.ordinal)}
            unitCount={cartUnitCount(cart)}
            lineCount={cartLineCount(cart)}
            total={totals.total}
            customerName={customerName}
            wide={layout.breakpoint === 'tablet'}
            onOpenCart={() => router.push('/pos/cart')}
            onCheckout={() => router.push('/pos/checkout')}
          />
        )}
      </View>

      {layout.isCartPaneVisible ? (
        <View className="w-[380px] border-l border-border">
          <CartPanel products={activeProducts} desktop />
        </View>
      ) : null}
    </View>
  );
}
