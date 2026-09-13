import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { useLocalSearchParams } from 'expo-router';
import {
  customerGroups as seedCustomerGroups,
  customers as seedCustomers,
  priceLists as seedPriceLists,
  priceRules as seedPriceRules,
  products as seedProducts,
  promotions as seedPromotions,
} from '../../data/seed';
import { resolvePrice } from '../../domain/pricing';
import type { Product, StockLevel } from '../../domain/types';
import { useT } from '../../i18n';
import { ProductGrid, type TileQuote } from '../pos/components/product-grid';
import { priceSourceBadge } from '../pos/lib/wholesale';
import { usePosLayout } from '../pos/hooks/use-pos-layout';
import { CashBookPerfTable, ReceivablesPerfTable } from './perf-tables';

/** The catalogue size the phase-5 perf budget is written against. */
export const PERF_PRODUCT_COUNT = 1000;
/** Default row counts for the two phase-7 money tables. */
export const PERF_RECEIVABLE_ROWS = 1000;
export const PERF_CASH_BOOK_ROWS = 500;

/** A store id of this harness's own, so nothing here can be mistaken for a real shop's stock. */
const PERF_STORE_ID = 'perf-store';
/**
 * `?real=1` measures the grid against the seeded branch instead: the first cycle of the
 * catalogue keeps the seed product ids, so the lot store answers `expiringLotsFor` and the
 * price rules match, which is what the FEFO badge and the wholesale quote cost in the shop.
 */
const REAL_STORE_ID = 'store-1';
/** No branch prices in the harness; shared so the grid does not get a new map each render. */
const NO_STORE_PRICES: ReadonlyMap<string, number> = new Map();
/** The seeded company buyer the wholesale case prices for (Đại lý A, contract rules). */
const PERF_BUYER_ID = 'customer-41';

/** What the harness is measuring. */
export type PerfCase = 'grid' | 'receivables' | 'cashbook';

function perfCase(raw: string | string[] | undefined): PerfCase {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'receivables' || value === 'cashbook' ? value : 'grid';
}

/**
 * Where the measurements land for `scripts/qa/e2e/specs/perf.spec.ts` to read. The spec takes
 * its own `performance.now()` before navigating here, so one mark on this side is enough: the
 * window between the two covers building the catalogue, rendering it and painting it.
 */
export interface PerfMarks {
  /** Rows actually rendered: tiles for the grid, table rows for the money cases. */
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

/** A table size from the URL, bounded the same way a catalogue size is. */
function clampRows(raw: string | string[] | undefined, fallback: number): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(5000, Math.round(value));
}

/**
 * Builds `count` products by cycling the seed catalogue, so every tile carries a real name,
 * price, unit and bundled photo and the grid does the same work per row it does in the shop.
 * Pure and deterministic: the same count always produces the same catalogue.
 */
export function buildPerfCatalog(
  count: number,
  withImages = true,
  options: { storeId?: string; realIds?: boolean } = {},
): { products: Product[]; stockLevels: StockLevel[] } {
  const storeId = options.storeId ?? PERF_STORE_ID;
  const products: Product[] = [];
  const stockLevels: StockLevel[] = [];

  for (let index = 0; index < count; index += 1) {
    const base = seedProducts[index % seedProducts.length];
    const lot = Math.floor(index / seedProducts.length) + 1;
    // `realIds` keeps the seed id for the first cycle, so lot lookups and price rules hit;
    // later cycles stay synthetic, which keeps every key in the list unique either way.
    const id = options.realIds && lot === 1 ? base.id : `perf-${index + 1}`;
    products.push({
      ...base,
      id,
      sku: `${base.sku}-L${lot}`,
      barcode: String(8_930_000_000_000 + index),
      name: lot === 1 ? base.name : `${base.name} (lô ${lot})`,
      imageUrl: withImages ? base.imageUrl : undefined,
    });
    stockLevels.push({
      productId: id,
      storeId,
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
 * Phase 7 added three knobs to the same route rather than three routes, because `app/**` is not
 * this worker's to add to: `?wholesale=1` prices every tile through the precedence engine and
 * gives it the price-source badge and the unit selector, `?real=1` keeps the seed product ids
 * for the first cycle so the FEFO badge has real lots to find, and `?case=receivables` /
 * `?case=cashbook` replace the grid with the money tables (`perf-tables.tsx`).
 *
 * The catalogue is deliberately **not** written into `catalog-store`: `persistence-bootstrap`
 * subscribes to that store, so seeding it would serialise roughly 300 KB into localStorage on
 * a debounce timer, which both persists a synthetic catalogue into the demo and lands a long
 * JSON stringify in the middle of the frame-time measurement. The grid takes its products as
 * props, so the harness owns them in memory and nothing outside this screen sees them.
 */
export function PerfHarnessScreen() {
  const t = useT();
  const layout = usePosLayout();
  const params = useLocalSearchParams<{
    count?: string;
    images?: string;
    case?: string;
    rows?: string;
    real?: string;
    wholesale?: string;
    nonce?: string;
  }>();
  // `?count=120` measures today's catalogue and `?images=0` the same grid without photos, so a
  // frame cost can be pinned on the catalogue size or on the tile's picture.
  const count = clampCount(params.count);
  const withImages = params.images !== '0';
  // `?case=receivables` / `?case=cashbook` measure the phase-7 money tables instead.
  const measuring = perfCase(params.case);
  const realIds = params.real === '1';
  const wholesale = params.wholesale === '1';
  const storeId = realIds ? REAL_STORE_ID : PERF_STORE_ID;
  const catalog = useMemo(
    () => buildPerfCatalog(count, withImages, { storeId, realIds }),
    [count, withImages, storeId, realIds],
  );

  // `?wholesale=1`: the tile prices through the real precedence engine for the seeded company
  // buyer, wears the price-source badge and offers the unit selector, which is what the phase-7
  // sell screen does with the switch on. Built here rather than read off `use-wholesale-pricing`
  // because that hook needs a session and a cart, and the harness has neither.
  const buyer = useMemo(
    () => (wholesale ? seedCustomers.find((customer) => customer.id === PERF_BUYER_ID) : undefined),
    [wholesale],
  );
  const quoteFor = useMemo(() => {
    if (!wholesale) return undefined;
    const group = seedCustomerGroups.find((item) => item.id === buyer?.groupId);
    return (product: Product, unit: string | undefined): TileQuote => {
      const resolution = resolvePrice(product, 1, unit, {
        storeId,
        customer: buyer,
        groups: seedCustomerGroups,
        priceLists: seedPriceLists,
        priceRules: seedPriceRules,
        promotions: seedPromotions,
        channel: 'wholesale',
      });
      const promotionName = seedPromotions.find((item) => item.id === resolution.promotionId)?.name;
      return {
        price: resolution.unitPrice,
        badge: priceSourceBadge(t, resolution.source, { group, promotionName }),
        minOrderText:
          product.minOrderQty && product.minOrderQty > 1
            ? `Tối thiểu ${product.minOrderQty}`
            : undefined,
      };
    };
  }, [wholesale, buyer, storeId, t]);

  // Every SKU that has a case unit is quoting the case, so the selector renders in the state
  // the seller leaves it in rather than on its cheap default.
  const unitByProduct = useMemo(() => {
    if (!wholesale) return undefined;
    const index = new Map<string, string>();
    for (const product of catalog.products) {
      const caseUnit = product.units?.[product.units.length - 1]?.unit;
      if (caseUnit) index.set(product.id, caseUnit);
    }
    return index;
  }, [wholesale, catalog.products]);

  const rowCount = clampRows(params.rows, measuring === 'cashbook' ? PERF_CASH_BOOK_ROWS : PERF_RECEIVABLE_ROWS);
  const productCount = measuring === 'grid' ? catalog.products.length : rowCount;
  // `?nonce=` is the spec's run counter. Without it the effect below is keyed on a row count
  // that two consecutive measurements can share, and a run that re-measures the same size
  // would then wait for a mark that never gets republished.
  const nonce = Array.isArray(params.nonce) ? params.nonce[0] : params.nonce;
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
  }, [productCount, measuring, nonce]);

  return (
    <View className="flex-1" testID="perf-harness-root">
      <View className="flex-row items-center gap-2 border-b border-border bg-surface px-4 py-2">
        <Text variant="label" className="font-semibold text-foreground">
          Perf harness
        </Text>
        <Text variant="caption" className="text-muted-foreground" testID="perf-product-count">
          {measuring === 'grid'
            ? `${catalog.products.length} sản phẩm · ${layout.gridColumns} cột · ảnh ${withImages ? 'bật' : 'tắt'}${wholesale ? ' · sỉ' : ''}${realIds ? ' · lô thật' : ''}`
            : `${rowCount} dòng · ${measuring === 'cashbook' ? 'sổ quỹ' : 'phải thu'}`}
        </Text>
      </View>

      {measuring === 'receivables' ? (
        <ReceivablesPerfTable rows={rowCount} />
      ) : measuring === 'cashbook' ? (
        <CashBookPerfTable rows={rowCount} />
      ) : (
        <ProductGrid
          products={catalog.products}
          stockLevels={catalog.stockLevels}
          storeId={storeId}
          // The harness measures the grid, not the pricing rule, so it runs on the chain
          // price: an empty index makes `effectivePrice` fall through to `product.salePrice`.
          // `?wholesale=1` puts the precedence engine back in, per tile, as the switch does.
          storePrices={NO_STORE_PRICES}
          columns={layout.gridColumns}
          gutter={layout.gutter}
          gap={layout.gap}
          imageAspectRatio={layout.imageAspectRatio}
          compactTiles={layout.compactTiles}
          lines={[]}
          onAddProduct={() => undefined}
          quoteFor={quoteFor}
          unitByProduct={unitByProduct}
          onUnitChange={wholesale ? () => undefined : undefined}
        />
      )}
    </View>
  );
}
