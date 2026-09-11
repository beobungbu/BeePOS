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
  Text,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { stores as allStores } from '../../data/seed';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { AdjustStockDialog } from './adjust-stock-dialog';
import { useIsWide } from './hooks/use-is-wide';
import { InventoryCards } from './inventory-cards';
import { buildStockRows, computeScopeStats, type StockRow } from './inventory-list-utils';
import { InventoryTable } from './inventory-table';
import { MovementHistoryDialog } from './movement-history-dialog';

type StoreScope = string | 'all';

export function InventoryScreen() {
  const t = useT();
  const isWide = useIsWide();
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

  function handleAdjust(row: StockRow) {
    setAdjustTarget({ productId: row.level.productId, storeId: row.level.storeId, productName: row.product.name });
  }

  function handleHistory(row: StockRow) {
    setHistoryTarget({ productId: row.level.productId, storeId: row.level.storeId, productName: row.product.name });
  }

  return (
    <ScrollView className="flex-1">
      <View className="flex-1 gap-4 p-4">
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="title">{t('inventory.title')}</Text>
          <View className="w-56">
            <Select value={scope} onValueChange={(value) => setScope(value)}>
              <SelectTrigger>
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

        {alertCount > 0 && (
          <AlertBanner
            variant="warning"
            title={`${alertCount} ${t('inventory.lowStockBanner')}`}
          />
        )}

        <View className={isWide ? 'flex-row gap-3' : 'gap-3'}>
          <Stat className="flex-1">
            <StatLabel>{t('inventory.stat.skuCount')}</StatLabel>
            <StatValue>{stats.skuCount}</StatValue>
          </Stat>
          <Stat className="flex-1">
            <StatLabel>{t('inventory.stat.totalCost')}</StatLabel>
            <StatValue>{formatVND(stats.totalCostValue)}</StatValue>
          </Stat>
          <Stat className="flex-1">
            <StatLabel>{t('inventory.stat.lowCount')}</StatLabel>
            <StatValue>{stats.lowCount}</StatValue>
          </Stat>
          <Stat className="flex-1">
            <StatLabel>{t('inventory.stat.outCount')}</StatLabel>
            <StatValue>{stats.outCount}</StatValue>
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
