import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Badge,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { costHistoryFor, latestCost } from '../../../domain/costing';
import { formatAmount, formatVND } from '../../../domain/money';
import { periodRange, REVENUE_STATUSES } from '../../../domain/reports';
import type { CostHistory } from '../../../domain/types';
import { useCatalogStore } from '../../../data/catalog-store';
import { useCostingStore } from '../../../data/costing-store';
import { useInventoryStore } from '../../../data/inventory-store';
import { useOrderStore } from '../../../data/order-store';
import { useOrgStore } from '../../../data/org-store';
import { useSessionStore } from '../../../data/session-store';
import { StatStrip } from '../../../components/stat-strip';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { formatDate } from '../../../lib/datetime';
import { useT } from '../../../i18n';
import '../../../i18n/money.vi';
import '../../../i18n/money.en';
import { fill } from '../../orders/lib/fill';
import { costHistoryRows } from '../lib/cost-history-rows';
import { marginPercentOf, productGrossProfit } from '../lib/gross-profit';

const CHAIN = 'chain';

const SOURCE_VARIANT: Record<CostHistory['source'], 'outline' | 'success' | 'warning'> = {
  seed: 'outline',
  receipt: 'success',
  manual: 'warning',
};

/** `9,8 %`: decimal comma and a space before the sign (direction doc section 8). */
function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} %`;
}

/**
 * The "Giá vốn" section of the product detail: how the weighted average got to where it is,
 * with the arithmetic on screen rather than in documentation.
 *
 * Exported from the money feature and rendered by the product screens, because the cost ledger
 * belongs to money while the product page belongs to the catalogue. It takes only a product id
 * so the host screen needs no state of its own.
 */
export function ProductCostHistory({ productId }: { productId: string }) {
  const t = useT();
  const isWide = useBreakpoint() !== 'phone';
  const history = useCostingStore((state) => state.history);
  const receipts = useInventoryStore((state) => state.goodsReceipts);
  const products = useCatalogStore((state) => state.products);
  const orders = useOrderStore((state) => state.orders);
  const stores = useOrgStore((state) => state.stores);
  const sessionStore = useSessionStore((state) => state.store);

  // Opens on the branch being worked in: a chain-wide list interleaves rows from four shops,
  // and "the average before this row" only means anything inside one of them.
  const [scope, setScope] = useState<string>(sessionStore?.id ?? CHAIN);
  const storeId = scope === CHAIN ? undefined : scope;
  const product = products.find((item) => item.id === productId);

  const rows = useMemo(
    () => costHistoryRows(costHistoryFor(history, productId, storeId), receipts, productId),
    [history, receipts, productId, storeId],
  );

  const sold = useMemo(() => {
    const range = periodRange('30d', new Date());
    const inRange = orders.filter(
      (order) =>
        order.createdAt >= range.start &&
        order.createdAt < range.end &&
        REVENUE_STATUSES.includes(order.status) &&
        (!storeId || order.storeId === storeId),
    );
    return productGrossProfit(inRange).find((row) => row.productId === productId);
  }, [orders, productId, storeId]);

  const average = latestCost(history, productId, storeId) ?? product?.costPrice ?? 0;
  const latestReceipt = [...rows].reverse().find((row) => row.unitCostIn !== undefined);
  const manualCount = rows.filter((row) => row.history.source === 'manual').length;
  const salePrice = product?.salePrice ?? 0;
  const example = [...rows].reverse().find((row) => row.onHandBefore !== undefined && row.qtyIn && row.averageBefore);
  // Receipt rows whose stored average cannot be produced from the price on the receipt. The
  // caption under the formula says so rather than leaving a reader to check the arithmetic and
  // conclude the table is wrong.
  const unreconciled = rows.filter(
    (row) => row.history.source === 'receipt' && row.qtyIn !== undefined && row.onHandBefore === undefined,
  ).length;

  if (rows.length === 0) {
    return <EmptyState title={t('money.cost.empty')} description={t('money.cost.formula')} />;
  }

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="min-w-40" accessibilityLabel={t('money.cost.storeLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CHAIN}>{t('money.cost.storeAll')}</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {manualCount > 0 ? (
          <Badge variant="warning">{fill(t('money.cost.manualWarning'), { count: manualCount })}</Badge>
        ) : null}
      </View>

      <StatStrip
        layout={isWide ? 'row' : 'stacked'}
        items={[
          { label: t('money.cost.stats.average'), value: formatVND(average) },
          {
            label: t('money.cost.stats.latest'),
            value: latestReceipt?.unitCostIn !== undefined ? formatVND(latestReceipt.unitCostIn) : t('money.cost.unknown'),
          },
          { label: t('money.cost.stats.salePrice'), value: formatVND(salePrice) },
          {
            label: t('money.cost.stats.margin'),
            value: formatPercent(marginPercentOf(salePrice, salePrice - average)),
            tone: salePrice - average > salePrice * 0.15 ? ('success' as const) : ('warning' as const),
          },
          { label: t('money.cost.stats.rows'), value: String(rows.length) },
        ]}
      />

      <Text variant="label" className="font-semibold text-foreground">
        {scope === CHAIN ? t('money.cost.historyTitle') : t('money.cost.historyTitleStore')}
      </Text>

      <Table layout="scroll">
        <TableHeader>
          <TableRow>
            <TableHead label={t('money.cost.columns.date')}>{t('money.cost.columns.date')}</TableHead>
            <TableHead label={t('money.cost.columns.source')}>{t('money.cost.columns.source')}</TableHead>
            <TableHead label={t('money.cost.columns.qtyIn')}>{t('money.cost.columns.qtyIn')}</TableHead>
            <TableHead label={t('money.cost.columns.unitCostIn')}>{t('money.cost.columns.unitCostIn')}</TableHead>
            <TableHead label={t('money.cost.columns.onHandBefore')}>{t('money.cost.columns.onHandBefore')}</TableHead>
            <TableHead label={t('money.cost.columns.averageBefore')}>{t('money.cost.columns.averageBefore')}</TableHead>
            <TableHead label={t('money.cost.columns.averageAfter')}>{t('money.cost.columns.averageAfter')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.history.createdAt.getTime()}-${row.history.storeId ?? 'chain'}-${index}`}>
              <TableCell label={t('money.cost.columns.date')}>
                <Text variant="caption" tone="muted" numeric="tabular">
                  {formatDate(row.history.createdAt.toISOString())}
                </Text>
              </TableCell>
              <TableCell label={t('money.cost.columns.source')}>
                <Badge variant={SOURCE_VARIANT[row.history.source]}>
                  {t(`money.cost.sources.${row.history.source}`)}
                </Badge>
                {row.refId ? (
                  <Text variant="caption" tone="muted" numeric="tabular">{row.refId}</Text>
                ) : null}
              </TableCell>
              <TableCell label={t('money.cost.columns.qtyIn')}>
                <Text
                  variant="label"
                  numeric="tabular"
                  className={`w-full text-right ${row.qtyIn ? 'text-foreground' : 'text-subtle-foreground'}`}
                >
                  {row.qtyIn ? `+${formatAmount(row.qtyIn)}` : '0'}
                </Text>
              </TableCell>
              <TableCell label={t('money.cost.columns.unitCostIn')}>
                <Text variant="label" numeric="tabular" className="w-full text-right">
                  {row.unitCostIn !== undefined ? formatVND(row.unitCostIn) : formatVND(row.averageAfter)}
                </Text>
              </TableCell>
              <TableCell label={t('money.cost.columns.onHandBefore')}>
                <Text
                  variant="label"
                  numeric="tabular"
                  className={`w-full text-right ${row.onHandBefore === undefined ? 'text-subtle-foreground' : 'text-foreground'}`}
                >
                  {row.onHandBefore === undefined ? t('money.cost.unknown') : formatAmount(row.onHandBefore)}
                </Text>
              </TableCell>
              <TableCell label={t('money.cost.columns.averageBefore')}>
                <Text
                  variant="label"
                  numeric="tabular"
                  className={`w-full text-right ${row.averageBefore === undefined ? 'text-subtle-foreground' : 'text-foreground'}`}
                >
                  {row.averageBefore === undefined ? t('money.cost.unknown') : formatVND(row.averageBefore)}
                </Text>
              </TableCell>
              <TableCell label={t('money.cost.columns.averageAfter')}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(row.averageAfter)}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <View className="gap-1.5 rounded-lg bg-surface-muted p-3">
        <Text variant="label" className="font-semibold text-foreground">
          {t('money.cost.formulaTitle')}
        </Text>
        <Text variant="caption" tone="muted">{t('money.cost.formula')}</Text>
        {example && example.qtyIn && example.averageBefore !== undefined && example.onHandBefore !== undefined ? (
          <Text variant="caption" tone="muted">
            {fill(t('money.cost.formulaExample'), {
              date: formatDate(example.history.createdAt.toISOString()),
              onHand: formatAmount(example.onHandBefore),
              before: formatAmount(example.averageBefore),
              qty: formatAmount(example.qtyIn),
              cost: formatAmount(example.unitCostIn ?? 0),
              total: formatAmount(example.onHandBefore + example.qtyIn),
              after: formatVND(example.averageAfter),
            })}
          </Text>
        ) : null}
        {unreconciled > 0 ? (
          <Text variant="caption" className="text-warning">{t('money.cost.formulaUnrecoverable')}</Text>
        ) : null}
        <Text variant="caption" tone="muted">{t('money.cost.formulaManual')}</Text>
      </View>

      <View className="gap-1.5 rounded-lg border border-border bg-surface p-3">
        <Text variant="label" className="font-semibold text-foreground">
          {t('money.cost.snapshotTitle')}
        </Text>
        <Text variant="caption" tone="muted">{t('money.cost.snapshotBody')}</Text>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="caption" tone="muted">{t('money.cost.snapshotQty')}</Text>
          <Text variant="caption" numeric="tabular" className="font-semibold text-foreground">
            {fill(t('money.cost.unitPieces'), { count: formatAmount(sold?.qty ?? 0) })}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="caption" tone="muted">{t('money.cost.snapshotCost')}</Text>
          <Text variant="caption" numeric="tabular" className="font-semibold text-foreground">
            {formatVND(sold && sold.qty > 0 ? sold.cogs / sold.qty : average)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="caption" tone="muted">{t('money.cost.snapshotTotal')}</Text>
          <Text variant="caption" numeric="tabular" className="font-bold text-foreground">
            {formatVND(sold?.cogs ?? 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}
