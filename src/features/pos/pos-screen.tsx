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
import { useOrgStore } from '../../data/org-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift, useRegisterShift } from '../../data/shift-store';
import { useStorePriceIndex } from '../../data/store-price-store';
import { effectivePrice } from '../../domain/catalog';
import { findByBarcode, unitFactor } from '../../domain/units';
import { CartPanel } from './components/cart-panel';
import { CatalogSearch } from './components/catalog-search';
import { ALL_CATEGORY, CategoryChips } from './components/category-chips';
import { FloatingCartBar } from './components/floating-cart-bar';
import { NoShiftBanner } from './components/no-shift-banner';
import { OrderTabStrip } from './components/order-tab-strip';
import { ProductGrid } from './components/product-grid';
import { ShiftChip } from './components/shift-chip';
import { useBarcodeScan } from './hooks/use-barcode-scan';
import { usePosLayout } from './hooks/use-pos-layout';
import { useCartRepricing, useWholesalePricing } from './hooks/use-wholesale-pricing';
import { cartTotalsOf, cartLineCount, cartUnitCount } from './lib/cart-totals';
import { cartLabel } from './lib/order-label';
import { priceSourceBadge, tileMinOrderText } from './lib/wholesale';

export default function PosScreen() {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const layout = usePosLayout();

  const store = useSessionStore((state) => state.store);
  const staffId = useSessionStore((state) => state.staff?.id);
  const staffList = useOrgStore((state) => state.staff);
  const currentShift = useCurrentShift();
  // What this till is doing, whoever opened it: the register picker reads the same fact.
  const registerShift = useRegisterShift();
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const customers = useCustomerStore((state) => state.customers);
  // What this branch charges. Indexed, because the grid re-prices every visible tile on every
  // render and scanning the override rows per tile would cost `tiles x overrides` per frame.
  const storePrices = useStorePriceIndex();
  const cart = useActiveCart();
  const ensureStore = useCartStore((state) => state.ensureStore);
  const addProduct = useCartStore((state) => state.addProduct);
  const addPricedProduct = useCartStore((state) => state.addPricedProduct);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORY);
  /** The selling unit each tile is quoting. Absent means the product's base unit. */
  const [tileUnits, setTileUnits] = useState<ReadonlyMap<string, string>>(() => new Map());

  const { wholesale, explain } = useWholesalePricing(cart);
  useCartRepricing(cart);

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

  function handleAddProduct(product: Product, unit?: string) {
    const selectedUnit = unit ?? tileUnits.get(product.id);
    if (wholesale) {
      // Priced through the engine at the quantity the order will end up holding, so a tile
      // that says "Bậc 10+" adds a line at that tier rather than at the shelf price.
      const existing = cart.lines.find((line) => line.productId === product.id);
      const sameUnit = existing ? (existing.unit ?? undefined) === (selectedUnit ?? undefined) : false;
      const nextQty = existing && sameUnit ? existing.qty + 1 : 1;
      const { resolution } = explain(product, nextQty, selectedUnit);
      addPricedProduct(product.id, {
        unit: selectedUnit,
        unitFactor: unitFactor(product, selectedUnit),
        unitPrice: resolution.unitPrice,
        priceSource: resolution.source,
        promotionId: resolution.promotionId,
      });
    } else {
      // The line keeps the price at sale time, so a price changed later never rewrites a bill
      // that was already rung up.
      addProduct(product.id, effectivePrice(product, store?.id, storePrices));
    }
    toast.show({ title: t('pos.addedToCart'), description: product.name, variant: 'success', duration: 1500 });
  }

  /**
   * A hardware scanner types the barcode and sends Enter without ever touching the search
   * field, so the burst is caught at the window and looked up here. An unknown code names
   * itself in the toast: the cashier can read it off the packet and check the catalog.
   *
   * The lookup searches every code the SKU answers to, the case barcode included, and adds
   * the unit that code belongs to: scanning a carton adds the carton, not one can.
   *
   * Plain functions, not `useCallback`: the hook keeps the latest one in a ref, so memoising
   * would buy nothing and would freeze `t` at the locale of the first render.
   */
  function handleScan(code: string) {
    const match = findByBarcode(activeProducts, code);
    if (match) {
      handleAddProduct(match.product, match.factor > 1 ? match.unit : undefined);
      return;
    }
    toast.show({
      title: t('pos.barcodeNotFound'),
      description: code,
      variant: 'warning',
      duration: 4000,
    });
  }

  // Native returns a 1x1 transparent capture field the hardware scanner types into; web
  // listens on the document and returns null, so `{scanCapture}` renders nothing there.
  const scanCapture = useBarcodeScan(handleScan);

  function handleBarcodeSubmit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const match = findByBarcode(activeProducts, trimmed);
    if (match) {
      handleAddProduct(match.product, match.factor > 1 ? match.unit : undefined);
      setQuery('');
    } else if (trimmed.length >= 8) {
      // Only treat long numeric-looking input as a barcode scan attempt; short queries just filter.
      toast.show({ title: t('pos.barcodeNotFound'), variant: 'destructive', duration: 2000 });
    }
  }

  function handleTileUnitChange(product: Product, unit: string | undefined) {
    setTileUnits((previous) => {
      const next = new Map(previous);
      if (unit) next.set(product.id, unit);
      else next.delete(product.id);
      return next;
    });
  }

  /**
   * What a tile quotes on a wholesale order: the engine's price for one of the selected unit,
   * the label naming where it came from, and the minimum-order note when one unit is under
   * the product's wholesale minimum.
   */
  function quoteFor(product: Product, unit: string | undefined) {
    const { resolution, group, minQty, promotionName } = explain(product, 1, unit);
    return {
      price: resolution.unitPrice,
      badge: priceSourceBadge(t, resolution.source, { group, minQty, promotionName }),
      minOrderText: tileMinOrderText(t, product, unit),
    };
  }

  const totals = cartTotalsOf(cart, activeProducts);
  const customerName = customers.find((item) => item.id === cart.customerId)?.name;

  const shiftOnTill = currentShift ?? registerShift;
  const otherCashierName =
    shiftOnTill && shiftOnTill.cashierId !== staffId
      ? staffList.find((member) => member.id === shiftOnTill.cashierId)?.name ?? shiftOnTill.cashierId
      : undefined;
  const shiftStrip = !shiftOnTill ? (
    <NoShiftBanner gutter={layout.gutter} verbose={layout.breakpoint !== 'phone'} />
  ) : layout.breakpoint === 'desktop' ? null : (
    <ShiftChip shift={shiftOnTill} otherCashierName={otherCashierName} gutter={layout.gutter} />
  );

  return (
    <View className="flex-1 flex-row">
      {scanCapture}
      <View className="min-w-0 flex-1">
        <OrderTabStrip products={activeProducts} />
        {/* One strip, three states, all from the same two shifts: no shift on this till, the
            cashier's own, or somebody else's handover. Desktop keeps the sidebar route to
            `/pos/shift` and does not need the chip (P7-05, P7-06). */}
        {shiftStrip}

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
          storePrices={storePrices}
          lines={cart.lines}
          onAddProduct={handleAddProduct}
          quoteFor={wholesale ? quoteFor : undefined}
          unitByProduct={wholesale ? tileUnits : undefined}
          onUnitChange={wholesale ? (product, unit) => handleTileUnitChange(product, unit) : undefined}
          catalogEmpty={activeProducts.length === 0}
        />

        {layout.isCartPaneVisible ? null : (
          <FloatingCartBar
            orderLabel={cartLabel(t, cart)}
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
