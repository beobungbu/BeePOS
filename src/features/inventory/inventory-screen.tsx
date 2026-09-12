import { router } from 'expo-router';
import {
  AlertBanner,
  Button,
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
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { stores as allStores } from '../../data/seed';
import { formatVND } from '../../domain/money';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useT } from '../../i18n';
import { AdjustStockDialog } from './adjust-stock-dialog';
import { InventoryCards } from './inventory-cards';
import { buildStockRows, computeScopeStats, type StockRow } from './inventory-list-utils';
import { InventoryTable } from './inventory-table';
import { MovementHistoryDialog } from './movement-history-dialog';

type StoreScope = string | 'all';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

/** One card style for every Stat on the admin screens (direction doc section 5). */
const STAT_CARD = 'gap-1 rounded-lg border border-border bg-surface p-4';

export function InventoryScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const staff = useSessionStore((state) => state.staff);
  const currentStore = useSessionStore((state) => state.store);
  const products = useCatalogStore((state) => state.products);
  const stockLevels = useInventoryStore((state) => state.stockLevels);

  const canViewAllStores = staff?.role === 'owner' || staff?.role === 'manager';
  const [scope, setScope] = useState<StoreScope>(currentStore?.id ?? allStores[0].id);
  const [activeTab, setActiveTab] = useState<'stock' | 'low'>('stock');
  const [adjustTarget, setAdjustTarget] = useState<{ productId: string; storeId: string; productName: string } | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ productId: string; storeId: string; productName: string } | null>(null);

  const rows = useMemo(
    () => buildStockRows(stockLevels, products, allStores, scope),
    [stockLevels, products, scope],
  );
  const stats = useMemo(() => computeScopeStats(rows), [rows]);
  const lowRows = useMemo(() => rows.filter((row) => row.status !== 'ok'), [rows]);
  const alertCount = stats.lowCount + stats.outCount;
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

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        {/* The one screen where a full alert banner is allowed, and only above the filters. */}
        {alertCount > 0 && (
          <AlertBanner variant="warning" title={`${alertCount} ${t('inventory.lowStockBanner')}`} />
        )}

        <View className={isWide ? 'flex-row flex-wrap items-center gap-2' : 'gap-2'}>
          <View className={isWide ? 'w-56' : ''}>
            <Select value={scope} onValueChange={(value) => setScope(value)}>
              <SelectTrigger accessibilityLabel={t('products.form.stockColumns.store')}>
                <SelectValue placeholder={t('inventory.storeAll')} />
              </SelectTrigger>
              <SelectContent>
                {canViewAllStores && (
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
          <View className="flex-row flex-wrap gap-2">
            <Button variant="outline" onPress={() => router.push('/inventory/receipts')}>
              {t('inventory.receipts.title')}
            </Button>
            <Button variant="outline" onPress={() => router.push('/inventory/transfers')}>
              {t('inventory.transfers.title')}
            </Button>
            <Button variant="outline" onPress={() => router.push('/inventory/counts')}>
              {t('inventory.counts.title')}
            </Button>
          </View>
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
          <TabsContent value="stock">
            {isWide ? (
              <InventoryTable rows={rows} showStore={scope === 'all'} onAdjust={handleAdjust} onHistory={handleHistory} />
            ) : (
              <InventoryCards rows={rows} showStore={scope === 'all'} onSelect={handleAdjust} />
            )}
          </TabsContent>
          <TabsContent value="low">
            {isWide ? (
              <InventoryTable rows={lowRows} showStore={scope === 'all'} onAdjust={handleAdjust} onHistory={handleHistory} />
            ) : (
              <InventoryCards rows={lowRows} showStore={scope === 'all'} onSelect={handleAdjust} />
            )}
          </TabsContent>
        </Tabs>
      </View>

      <AdjustStockDialog target={adjustTarget} onClose={() => setAdjustTarget(null)} />
      <MovementHistoryDialog target={historyTarget} onClose={() => setHistoryTarget(null)} />
    </ScrollView>
  );
}
