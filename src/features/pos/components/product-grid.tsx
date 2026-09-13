import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonLabel, EmptyState } from '@beemvp/beeui-ui';
import { effectivePrice } from '../../../domain/catalog';
import { expiringLotsFor, gradeLot } from '../../inventory/lib/lots';
import type { CartLine, Product, StockLevel } from '../../../domain/types';
import { useT } from '../../../i18n';
// The two words the empty catalogue offers belong to other areas' dictionaries.
import '../../../i18n/products.vi';
import '../../../i18n/products.en';
import '../../../i18n/inventory.vi';
import '../../../i18n/inventory.en';
import type { PriceSourceBadge } from '../lib/wholesale';
import { ProductCard } from './product-card';
import { SecondaryButtonLabel } from './secondary-button-label';

/** What a tile quotes when the order is on the wholesale switch. */
export interface TileQuote {
  price: number;
  badge?: PriceSourceBadge;
  minOrderText?: string;
}

interface ProductGridProps {
  products: Product[];
  stockLevels: StockLevel[];
  storeId: string;
  columns: number;
  /** Page gutter and grid gap for the current band, in points. */
  gutter: number;
  gap: number;
  imageAspectRatio: number;
  /** Small type step for the 3 column phone grid. */
  compactTiles?: boolean;
  /** Per-store price overrides, indexed; the grid prices every tile through it. */
  storePrices: ReadonlyMap<string, number>;
  lines: CartLine[];
  onAddProduct: (product: Product) => void;
  /**
   * Wholesale only. Absent, every tile prices through `effectivePrice` exactly as it always
   * has: the precedence engine walks rule arrays per tile, which is a cost a retail grid of a
   * thousand products should not pay for a feature it is not using.
   */
  quoteFor?: (product: Product, unit: string | undefined) => TileQuote;
  /** The selling unit each tile is quoting, keyed by product. Absent means the base unit. */
  unitByProduct?: ReadonlyMap<string, string>;
  onUnitChange?: (product: Product, unit: string | undefined, factor: number) => void;
  /**
   * True when the chain has no catalogue at all, as opposed to a search or a category that
   * matched nothing. A new chain starts empty, and "thử đổi danh mục" is no help to a shop
   * that has never added a product: it needs the import and the add form.
   */
  catalogEmpty?: boolean;
}

export function ProductGrid({
  products,
  stockLevels,
  storeId,
  columns,
  gutter,
  gap,
  imageAspectRatio,
  compactTiles = false,
  storePrices,
  lines,
  onAddProduct,
  quoteFor,
  unitByProduct,
  onUnitChange,
  catalogEmpty = false,
}: ProductGridProps) {
  const t = useT();
  const router = useRouter();

  // Indexed once per data change instead of scanned per tile. `renderItem` runs for every
  // visible cell on every scroll frame, so the two `find` calls that used to sit inside it
  // made the grid cost `tiles x stockLevels` per frame, which is what the thousand-product
  // catalogue of the perf harness turns into dropped frames.
  const stockByProductId = useMemo(() => {
    const index = new Map<string, StockLevel>();
    for (const level of stockLevels) {
      if (level.storeId === storeId) index.set(level.productId, level);
    }
    return index;
  }, [stockLevels, storeId]);

  // First line wins, as the `find` it replaces did; the cart keys its lines by product, so
  // there is never a second one to disagree with.
  const qtyByProductId = useMemo(() => {
    const index = new Map<string, number>();
    for (const line of lines) if (!index.has(line.productId)) index.set(line.productId, line.qty);
    return index;
  }, [lines]);

  if (products.length === 0) {
    return (
      <View className="flex-1 items-start bg-surface-muted px-6 pt-12">
        <View className="w-full max-w-[280px] self-center">
          <EmptyState
            title={catalogEmpty ? t('products.emptyTitle') : t('pos.emptyCatalogTitle')}
            description={
              catalogEmpty ? t('products.emptyDescription') : t('pos.emptyCatalogDescription')
            }
            action={
              catalogEmpty ? (
                <View className="w-full gap-2">
                  {/* The import first: a shop opening on BeePOS has its products in a
                      spreadsheet already, and typing 300 of them into the add form is not an
                      onboarding. */}
                  <Button onPress={() => router.push('/inventory/import')}>
                    <ButtonLabel>{t('inventory.import.title')}</ButtonLabel>
                  </Button>
                  <Button variant="outline" onPress={() => router.push('/products/new')}>
                    <SecondaryButtonLabel>{t('products.addProduct')}</SecondaryButtonLabel>
                  </Button>
                </View>
              ) : undefined
            }
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      key={columns}
      className="bg-surface-muted"
      data={products}
      numColumns={columns}
      // Window the list: the default batching commits 10 rows (50 tiles) per pass, which drops
      // frames past 400 products. Four rows per batch and a 7-screen window keep p95 under 17 ms
      // at 1000 products (measured in the /audit/perf harness).
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={7}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: gutter, gap }}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      renderItem={({ item }) => {
        const stock = stockByProductId.get(item.id);
        const inCart = qtyByProductId.get(item.id) ?? 0;
        const unit = unitByProduct?.get(item.id);
        const quote = quoteFor?.(item, unit);
        // Only the SKUs that opted into lots are asked: `expiringLotsFor` reads the lot store
        // itself, and a grid of a thousand tiles must not pay for a feature ten of them use.
        const lots = item.trackLots ? expiringLotsFor(item.id, storeId) : [];
        const expiryWarning =
          lots.length > 0
            ? {
                text: lots.some((lot) => gradeLot(lot) === 'expired')
                  ? t('pos.expiry.expired')
                  : t('pos.expiry.soon'),
                expired: lots.some((lot) => gradeLot(lot) === 'expired'),
              }
            : undefined;
        return (
          // `flex: 1 / columns`, not `flex-1`: a last row (or a filtered result) holding one
          // item would otherwise stretch that tile across the full grid width.
          <View style={{ flex: 1 / columns }}>
            <ProductCard
              product={item}
              price={quote ? quote.price : effectivePrice(item, storeId, storePrices)}
              stock={stock}
              inCart={inCart}
              imageAspectRatio={imageAspectRatio}
              compact={compactTiles}
              onAdd={() => onAddProduct(item)}
              unit={unit}
              onUnitChange={
                onUnitChange
                  ? (nextUnit, factor) => onUnitChange(item, nextUnit, factor)
                  : undefined
              }
              priceBadge={quote?.badge}
              minOrderText={quote?.minOrderText}
              expiryWarning={expiryWarning}
            />
          </View>
        );
      }}
    />
  );
}
