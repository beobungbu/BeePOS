import { useEffect, useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { useLocalSearchParams } from 'expo-router';
import { products as seedProducts } from '../../data/seed';
import type { Product, StockLevel } from '../../domain/types';
import { ProductCard } from '../pos/components/product-card';
import { ProductGrid } from '../pos/components/product-grid';
import { usePosLayout } from '../pos/hooks/use-pos-layout';

/** The catalogue size the phase-5 perf budget is written against. */
export const PERF_PRODUCT_COUNT = 1000;

/** A store id of this harness's own, so nothing here can be mistaken for a real shop's stock. */
const PERF_STORE_ID = 'perf-store';

/**
 * Where the measurements land for `scripts/qa/e2e/specs/perf.spec.ts` to read. The spec takes
 * its own `performance.now()` before navigating here, so one mark on this side is enough: the
 * window between the two covers building the catalogue, rendering it and painting it.
 */
export interface PerfMarks {
  /** Catalogue size actually rendered. */
  products: number;
  /** `performance.now()` in the first frame after the grid's first commit. */
  firstTileAt?: number;
}

declare global {
  var __beeposPerf: PerfMarks | undefined;
}

/** A catalogue size from the URL, bounded so a typo cannot lock the browser up. */
function clampCount(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value <= 0) return PERF_PRODUCT_COUNT;
  return Math.min(5000, Math.round(value));
}

/** Rows per windowing batch from the URL, or `undefined` for the sell screen's own grid. */
function batchRows(raw: string | string[] | undefined): number | undefined {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(50, Math.round(value));
}

/**
 * Builds `count` products by cycling the seed catalogue, so every tile carries a real name,
 * price, unit and bundled photo and the grid does the same work per row it does in the shop.
 * Pure and deterministic: the same count always produces the same catalogue.
 */
export function buildPerfCatalog(
  count: number,
  withImages = true,
): { products: Product[]; stockLevels: StockLevel[] } {
  const products: Product[] = [];
  const stockLevels: StockLevel[] = [];

  for (let index = 0; index < count; index += 1) {
    const base = seedProducts[index % seedProducts.length];
    const lot = Math.floor(index / seedProducts.length) + 1;
    products.push({
      ...base,
      id: `perf-${index + 1}`,
      sku: `${base.sku}-L${lot}`,
      barcode: String(8_930_000_000_000 + index),
      name: lot === 1 ? base.name : `${base.name} (lô ${lot})`,
      imageUrl: withImages ? base.imageUrl : undefined,
    });
    stockLevels.push({
      productId: `perf-${index + 1}`,
      storeId: PERF_STORE_ID,
      // A spread of states so the tile renders each stock pill variant, not just the cheap one.
      onHand: index % 37,
      reserved: 0,
      minLevel: 5,
    });
  }

  return { products, stockLevels };
}

/**
 * Hidden, unlinked route (`/audit/perf`) that renders the sell screen's product grid over a
 * 1000 product catalogue and publishes two marks on `window` for the Playwright perf spec:
 * when the render started and when the first tile reached the screen.
 *
 * The catalogue is deliberately **not** written into `catalog-store`: `persistence-bootstrap`
 * subscribes to that store, so seeding it would serialise roughly 300 KB into localStorage on
 * a debounce timer, which both persists a synthetic catalogue into the demo and lands a long
 * JSON stringify in the middle of the frame-time measurement. The grid takes its products as
 * props, so the harness owns them in memory and nothing outside this screen sees them.
 */
export function PerfHarnessScreen() {
  const layout = usePosLayout();
  const params = useLocalSearchParams<{ count?: string; images?: string; batch?: string }>();
  // `?count=120` measures today's catalogue and `?images=0` the same grid without photos, so a
  // frame cost can be pinned on the catalogue size or on the tile's picture.
  const count = clampCount(params.count);
  const withImages = params.images !== '0';
  // `?batch=4` swaps in the same grid with the list windowing knobs set (see `BatchedGrid`).
  const batch = batchRows(params.batch);
  const catalog = useMemo(() => buildPerfCatalog(count, withImages), [count, withImages]);

  const productCount = catalog.products.length;
  useEffect(() => {
    // Published from the effect rather than during render: the marks are a side effect, and
    // the effect runs after the commit anyway. The next animation frame is the first one that
    // can show the tiles, which is as close to "first tile painted" as the DOM can report.
    const marks: PerfMarks = { products: productCount };
    globalThis.__beeposPerf = marks;
    const frame = requestAnimationFrame(() => {
      marks.firstTileAt = performance.now();
    });
    return () => cancelAnimationFrame(frame);
  }, [productCount]);

  return (
    <View className="flex-1" testID="perf-harness-root">
      <View className="flex-row items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <Text variant="label" className="font-semibold text-foreground">
          Perf harness
        </Text>
        <Text variant="caption" className="text-muted-foreground" testID="perf-product-count">
          {`${catalog.products.length} sản phẩm · ${layout.gridColumns} cột · ảnh ${withImages ? 'bật' : 'tắt'}${batch === undefined ? '' : ` · batch ${batch}`}`}
        </Text>
      </View>

      {batch === undefined ? (
        <ProductGrid
          products={catalog.products}
          stockLevels={catalog.stockLevels}
          storeId={PERF_STORE_ID}
          columns={layout.gridColumns}
          gutter={layout.gutter}
          gap={layout.gap}
          imageAspectRatio={layout.imageAspectRatio}
          compactTiles={layout.compactTiles}
          lines={[]}
          onAddProduct={() => undefined}
        />
      ) : (
        <BatchedGrid
          products={catalog.products}
          stockLevels={catalog.stockLevels}
          columns={layout.gridColumns}
          gutter={layout.gutter}
          gap={layout.gap}
          imageAspectRatio={layout.imageAspectRatio}
          compactTiles={layout.compactTiles}
          batch={batch}
        />
      )}
    </View>
  );
}

interface BatchedGridProps {
  products: Product[];
  stockLevels: StockLevel[];
  columns: number;
  gutter: number;
  gap: number;
  imageAspectRatio: number;
  compactTiles: boolean;
  /** Rows rendered per windowing batch. */
  batch: number;
}

/**
 * The same grid with the `FlatList` windowing knobs set (`?batch=4`), so a long-frame reading
 * off `ProductGrid` can be compared against a tuned list without touching the sell screen.
 * `ProductGrid` takes no windowing props, hence the copy; keep the two in step by hand or
 * delete this one once the knobs move into `ProductGrid` itself.
 */
function BatchedGrid({
  products,
  stockLevels,
  columns,
  gutter,
  gap,
  imageAspectRatio,
  compactTiles,
  batch,
}: BatchedGridProps) {
  const stockByProduct = useMemo(
    () => new Map(stockLevels.map((level) => [level.productId, level])),
    [stockLevels],
  );

  return (
    <FlatList
      key={columns}
      className="bg-surface-muted"
      data={products}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: gutter, gap }}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      initialNumToRender={batch}
      maxToRenderPerBatch={batch}
      windowSize={7}
      updateCellsBatchingPeriod={50}
      renderItem={({ item }) => (
        <View style={{ flex: 1 / columns }}>
          <ProductCard
            product={item}
            stock={stockByProduct.get(item.id)}
            inCart={0}
            imageAspectRatio={imageAspectRatio}
            compact={compactTiles}
            onAdd={() => undefined}
          />
        </View>
      )}
    />
  );
}
