import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Chip, ChipGroup, SearchInput, Sheet, SheetContent, SheetTitle, useToast } from '@beemvp/beeui-ui';
import { calcCart, type PricedCartLine } from '../../domain/pos';
import type { Product } from '../../domain/types';
import { useT } from '../../i18n';
import { useCartStore } from '../../data/cart-store';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift } from '../../data/shift-store';
import { CartPanel } from './components/cart-panel';
import { FloatingCartBar } from './components/floating-cart-bar';
import { NoShiftBanner } from './components/no-shift-banner';
import { ProductGrid } from './components/product-grid';
import { usePosLayout } from './hooks/use-pos-layout';

const ALL_CATEGORY = 'all';

export default function PosScreen() {
  const t = useT();
  const toast = useToast();
  const { isCartPaneVisible, gridColumns } = usePosLayout();

  const store = useSessionStore((state) => state.store);
  const currentShift = useCurrentShift();
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const cart = useCartStore((state) => state.cart);
  const ensureStore = useCartStore((state) => state.ensureStore);
  const addProduct = useCartStore((state) => state.addProduct);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const pricedLines: PricedCartLine[] = cart.lines.map((line) => ({
    ...line,
    taxRate: activeProducts.find((product) => product.id === line.productId)?.taxRate ?? 0,
  }));
  const totals = calcCart(pricedLines, cart.discount);
  const itemCount = cart.lines.reduce((count, line) => count + line.qty, 0);

  return (
    <View className="flex-1 flex-row">
      <View className="flex-1">
        {!currentShift && <NoShiftBanner />}

        <View className="gap-3 p-3">
          <SearchInput
            value={query}
            onChangeText={setQuery}
            onSearch={handleBarcodeSubmit}
            placeholder={t('pos.searchPlaceholder')}
          />
          <ChipGroup value={category} onValueChange={(value) => setCategory(value as string)}>
            <Chip value={ALL_CATEGORY}>{t('pos.categoryAll')}</Chip>
            {categories.map((cat) => (
              <Chip key={cat.id} value={cat.id}>
                {cat.name}
              </Chip>
            ))}
          </ChipGroup>
        </View>

        <ProductGrid
          products={filteredProducts}
          stockLevels={stockLevels}
          storeId={store?.id ?? ''}
          columns={gridColumns}
          onAddProduct={handleAddProduct}
        />

        {!isCartPaneVisible && (
          <FloatingCartBar itemCount={itemCount} total={totals.total} onPress={() => setSheetOpen(true)} />
        )}
      </View>

      {isCartPaneVisible && (
        <View className="w-[360px] border-l border-border">
          <CartPanel products={activeProducts} />
        </View>
      )}

      {!isCartPaneVisible && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent snapPoints={['85%']}>
            <SheetTitle>{t('pos.cart.title')}</SheetTitle>
            <CartPanel products={activeProducts} />
          </SheetContent>
        </Sheet>
      )}
    </View>
  );
}
