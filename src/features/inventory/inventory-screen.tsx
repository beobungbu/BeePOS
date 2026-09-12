import { router } from 'expo-router';
import {
  AlertBanner,
  Button,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stat,
  StatLabel,
  StatValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { stores as allStores } from '../../data/seed';
import { formatVND } from '../../domain/money';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { StatStrip } from '../../components/stat-strip';
import { CsvExportButton, type CsvExportData } from '../../components/csv-export-button';
import { Toolbar } from '../../components/toolbar';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { AdjustStockDialog } from './adjust-stock-dialog';
import { InventoryCards } from './inventory-cards';
import { buildStockRows, computeScopeStats, type StockRow } from './inventory-list-utils';
import { InventoryTable } from './inventory-table';
import { MovementHistoryDialog } from './movement-history-dialog';
import { canViewAllStores } from '../../domain/org';

type StoreScope = string | 'all';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'px-6' } as const;

/** One card style for every Stat on the admin screens (direction doc section 5). */
const STAT_CARD = 'gap-1 rounded-lg border border-border bg-surface p-4';

export function InventoryScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const isDesktop = breakpoint === 'desktop';
  const staff = useSessionStore((state) => state.staff);
  const currentStore = useSessionStore((state) => state.store);
  const products = useCatalogStore((state) => state.products);
  const stockLevels = useInventoryStore((state) => state.stockLevels);

  const canSeeAllStores = canViewAllStores(staff);
  const [scope, setScope] = useState<StoreScope>(currentStore?.id ?? allStores[0].id);
  // Desktop only, matching the 1440 frame of docs/design/mockups/inventory.html: the narrower
  // bands keep the tab pair and gain no search field in this phase.
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'low'>('stock');
  const [adjustTarget, setAdjustTarget] = useState<{ productId: string; storeId: string; productName: string } | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ productId: string; storeId: string; productName: string } | null>(null);

  const allRows = useMemo(
    () => buildStockRows(stockLevels, products, allStores, scope),
    [stockLevels, products, scope],
  );
  const rows = useMemo(() => {
    const needle = isDesktop ? search.trim().toLowerCase() : '';
    if (!needle) return allRows;
    return allRows.filter(
      (row) =>
        row.product.name.toLowerCase().includes(needle) ||
        row.product.sku.toLowerCase().includes(needle),
    );
  }, [allRows, isDesktop, search]);
  const stats = useMemo(() => computeScopeStats(rows), [rows]);
  const lowRows = useMemo(() => rows.filter((row) => row.status !== 'ok'), [rows]);
  const alertCount = stats.lowCount + stats.outCount;
  const lowOnly = activeTab === 'low';
  // One card per row on the phone: a wrapped money value ("272.909.5 / 00 đ") is unreadable.
  const statStyle = { flexGrow: 1, flexBasis: isWide ? 160 : '100%' } as const;
  const moneyStatStyle = { flexGrow: 1, flexBasis: isWide ? 220 : '100%' } as const;
  const scopeName = scope === 'all'
    ? t('inventory.storeAll')
    : allStores.find((store) => store.id === scope)?.name ?? t('inventory.storeAll');

  useScreenHeader({ title: t('inventory.title'), subtitle: `${scopeName} · ${stats.skuCount} SKU` });

  function handleAdjust(row: StockRow) {
    setAdjustTarget({ productId: row.level.productId, storeId: row.level.storeId, productName: row.product.name });
  }

  function handleHistory(row: StockRow) {
    setHistoryTarget({ productId: row.level.productId, storeId: row.level.storeId, productName: row.product.name });
  }

  const storeSelect = (
    <View className={isWide ? 'w-56' : ''}>
      <Select value={scope} onValueChange={(value) => setScope(value)}>
        <SelectTrigger accessibilityLabel={t('products.form.stockColumns.store')}>
          <SelectValue placeholder={t('inventory.storeAll')} />
        </SelectTrigger>
        <SelectContent>
          {canSeeAllStores && (
            <SelectItem value="all" textValue={t('inventory.storeAll')}>
              {t('inventory.storeAll')}
            </SelectItem>
          )}
          {allStores.map((store) => (
            <SelectItem key={store.id} value={store.id} textValue={store.name}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );

  // Exports the rows the scope, the search and the low-stock filter left on screen, so the
  // file matches what the stock keeper is looking at.
  function buildInventoryCsv(): CsvExportData {
    const visible = lowOnly ? lowRows : rows;
    return {
      header: [
        t('inventory.columns.product'),
        t('products.columns.sku'),
        t('products.form.stockColumns.store'),
        t('inventory.columns.onHand'),
        t('inventory.columns.reserved'),
        t('inventory.columns.available'),
        t('inventory.columns.minLevel'),
        t('inventory.columns.status'),
      ],
      rows: visible.map((row) => [
        row.product.name,
        row.product.sku,
        row.store.name,
        row.level.onHand,
        row.level.reserved,
        row.available,
        row.level.minLevel,
        t(row.status === 'out' ? 'inventory.statusOut' : row.status === 'low' ? 'inventory.statusLow' : 'inventory.statusOk'),
      ]),
    };
  }

  // Only one action per screen is primary (direction doc section 2), and receiving goods is
  // the one a stock keeper starts from, so it is last in the row and the only filled button.
  const documentButtons = (
    <>
      <CsvExportButton build={buildInventoryCsv} nameKey="inventory" />
      <Button variant="outline" onPress={() => router.push('/inventory/counts')}>
        {t('inventory.counts.title')}
      </Button>
      <Button variant="outline" onPress={() => router.push('/inventory/transfers')}>
        {t('inventory.transfers.title')}
      </Button>
      <Button onPress={() => router.push('/inventory/receipts')}>
        {t('inventory.receipts.title')}
      </Button>
    </>
  );

  const table = (visibleRows: StockRow[]) =>
    isWide ? (
      <InventoryTable rows={visibleRows} showStore={scope === 'all'} onAdjust={handleAdjust} onHistory={handleHistory} />
    ) : (
      <InventoryCards rows={visibleRows} showStore={scope === 'all'} onSelect={handleAdjust} />
    );

  if (isDesktop) {
    return (
      <View className="flex-1">
        {/* The banner and the Tồn kho / Sắp hết tab pair said the same thing on two rows and
            pushed the first stock row past the fold; the toolbar chip is both (phase 4,
            decision 5). */}
        <View className={`border-b border-border bg-surface ${GUTTER.desktop}`}>
          <Toolbar actions={documentButtons}>
            <View className="w-[300px]">
              <SearchInput
                accessibilityLabel={t('inventory.searchPlaceholder')}
                onChangeText={setSearch}
                onSearch={setSearch}
                placeholder={t('inventory.searchPlaceholder')}
              />
            </View>
            {storeSelect}
            {alertCount > 0 ? (
              <LowStockChip
                count={alertCount}
                label={fill(t('inventory.lowStockChip'), { count: alertCount })}
                selected={lowOnly}
                onPress={() => setActiveTab(lowOnly ? 'stock' : 'low')}
              />
            ) : null}
          </Toolbar>
        </View>

        <View className={GUTTER.desktop}>
          <StatStrip
            items={[
              { label: t('inventory.stat.skuCount'), value: String(stats.skuCount) },
              { label: t('inventory.stat.lowCount'), value: String(stats.lowCount), tone: 'warning' },
              { label: t('inventory.stat.outCount'), value: String(stats.outCount), tone: 'destructive' },
              { label: t('inventory.stat.reserved'), value: String(stats.reservedCount) },
              { label: t('inventory.stat.totalCost'), value: formatVND(stats.totalCostValue) },
            ]}
          />
        </View>

        <ScrollView className="min-h-0 flex-1" contentContainerClassName="pb-6">
          <View className={GUTTER.desktop}>{table(lowOnly ? lowRows : rows)}</View>
        </ScrollView>

        <AdjustStockDialog target={adjustTarget} onClose={() => setAdjustTarget(null)} />
        <MovementHistoryDialog target={historyTarget} onClose={() => setHistoryTarget(null)} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        {/* The one screen where a full alert banner is allowed, and only above the filters. */}
        {alertCount > 0 && (
          <AlertBanner variant="warning" title={`${alertCount} ${t('inventory.lowStockBanner')}`} />
        )}

        <View className={isWide ? 'flex-row flex-wrap items-center gap-2' : 'gap-2'}>
          {storeSelect}
          <View className="flex-row flex-wrap gap-2">{documentButtons}</View>
        </View>

        {/* Wrapping keeps the money value on one line: four cards do not fit a 768 pt column. */}
        <View className="flex-row flex-wrap gap-3">
          <Stat className={STAT_CARD} style={statStyle}>
            <StatLabel>{t('inventory.stat.skuCount')}</StatLabel>
            <StatValue className="text-2xl font-bold text-foreground">{stats.skuCount}</StatValue>
          </Stat>
          <Stat className={STAT_CARD} style={moneyStatStyle}>
            <StatLabel>{t('inventory.stat.totalCost')}</StatLabel>
            <StatValue className="text-2xl font-bold text-foreground">{formatVND(stats.totalCostValue)}</StatValue>
          </Stat>
          <Stat className={STAT_CARD} style={statStyle}>
            <StatLabel>{t('inventory.stat.lowCount')}</StatLabel>
            <StatValue className="text-2xl font-bold text-warning">{stats.lowCount}</StatValue>
          </Stat>
          <Stat className={STAT_CARD} style={statStyle}>
            <StatLabel>{t('inventory.stat.outCount')}</StatLabel>
            <StatValue className="text-2xl font-bold text-destructive">{stats.outCount}</StatValue>
          </Stat>
        </View>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stock' | 'low')}>
          <TabsList>
            <TabsTrigger value="stock">{t('inventory.tabStock')}</TabsTrigger>
            <TabsTrigger value="low">{t('inventory.tabLowStock')}</TabsTrigger>
          </TabsList>
          <TabsContent value="stock">{table(rows)}</TabsContent>
          <TabsContent value="low">{table(lowRows)}</TabsContent>
        </Tabs>
      </View>

      <AdjustStockDialog target={adjustTarget} onClose={() => setAdjustTarget(null)} />
      <MovementHistoryDialog target={historyTarget} onClose={() => setHistoryTarget(null)} />
    </ScrollView>
  );
}

/**
 * The low-stock filter, and the low-stock warning, as one 36 pt control. `Chip` is not used:
 * it documents no selected-state tint of its own beyond `ChipGroup` selection, and this chip
 * has to read as a warning whether or not it is the active filter.
 */
function LowStockChip({
  count,
  label,
  selected,
  onPress,
}: {
  count: number;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      accessibilityValue={{ now: count }}
      onPress={onPress}
      className={`h-9 shrink-0 justify-center rounded-full px-3.5 ${
        selected ? 'bg-warning' : 'bg-warning/15'
      }`}
    >
      <Text
        variant="label"
        className={`font-medium ${selected ? 'text-primary-foreground' : 'text-warning'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
