import { useMemo } from 'react';
import { View } from 'react-native';
import { Section, Text, VStack } from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { StatStrip, type StatStripItem } from '../../components/stat-strip';
import { useCustomerStore } from '../../data/customer-store';
import { useLedgerStore } from '../../data/ledger-store';
import { useSupplierStore } from '../../data/supplier-store';
import type { Aging } from '../../domain/ledger';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { ReportsFrame } from './components/reports-frame';
import { debtSummary, type PartyDebt } from './lib/report-analytics';
import { useReportFilters } from './use-report-filters';

/** Parties listed before the reader has to go to the money screens for the rest. */
const PARTY_ROWS = 8;

/**
 * What the chain is owed and what it owes, with the aging behind both figures.
 *
 * Balances are a position rather than a flow, so the period filter does not narrow them; the
 * branch filter does, through the branch stamped on each ledger entry.
 */
export function DebtReportScreen() {
  const t = useT();
  const filters = useReportFilters();
  const breakpoint = useBreakpoint();
  const entries = useLedgerStore((state) => state.entries);
  const customers = useCustomerStore((state) => state.customers);
  const suppliers = useSupplierStore((state) => state.suppliers);

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.tab.debt') });

  const summary = useMemo(() => {
    const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]));
    const supplierNames = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
    return debtSummary(
      entries,
      customerNames,
      supplierNames,
      new Date(),
      filters.storeId ?? undefined,
    );
  }, [entries, customers, suppliers, filters.storeId]);

  const stats: StatStripItem[] = [
    { label: t('reports.figure.receivable'), value: formatVND(summary.receivable) },
    {
      label: t('reports.figure.receivableOverdue'),
      value: formatVND(summary.receivableOverdue),
      tone: summary.receivableOverdue > 0 ? 'destructive' : 'foreground',
    },
    { label: t('reports.figure.payable'), value: formatVND(summary.payable) },
    {
      label: t('reports.figure.payableOverdue'),
      value: formatVND(summary.payableOverdue),
      tone: summary.payableOverdue > 0 ? 'warning' : 'foreground',
    },
  ];

  return (
    <ReportsFrame tab="debt" filters={filters}>
      <StatStrip items={stats} layout={breakpoint === 'desktop' ? 'row' : 'stacked'} />

      <Section title={t('reports.cut.receivables')}>
        <PartyList rows={summary.customers.slice(0, PARTY_ROWS)} />
      </Section>
      <Section title={t('reports.cut.receivableAging')}>
        <AgingRows aging={summary.receivableAging} />
      </Section>

      <Section title={t('reports.cut.payables')}>
        <PartyList rows={summary.suppliers.slice(0, PARTY_ROWS)} />
      </Section>
      <Section title={t('reports.cut.payableAging')}>
        <VStack gap="sm">
          <AgingRows aging={summary.payableAging} />
          <Text variant="caption" tone="muted">
            {t('reports.note.debtStore')}
          </Text>
        </VStack>
      </Section>
    </ReportsFrame>
  );
}

function PartyList({ rows }: { rows: PartyDebt[] }) {
  const t = useT();
  if (rows.length === 0) return <Text tone="muted">{t('reports.empty.noData')}</Text>;

  return (
    <View className="overflow-hidden rounded-lg border border-border bg-surface">
      {rows.map((row, index) => (
        <View
          key={row.partyId}
          className={`min-h-12 flex-row items-center justify-between gap-3 px-4 py-2 ${
            index === 0 ? '' : 'border-t border-border'
          }`}
        >
          <Text variant="label" className="min-w-0 flex-1 font-medium text-foreground" numberOfLines={1}>
            {row.name}
          </Text>
          <View className="items-end">
            <Text variant="label" numeric="tabular" className="font-bold text-foreground">
              {formatVND(row.balance)}
            </Text>
            {row.overdue > 0 ? (
              <Text variant="caption" numeric="tabular" className="text-destructive">
                {`${t('reports.column.overdue')} ${formatVND(row.overdue)}`}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function AgingRows({ aging }: { aging: Aging }) {
  const t = useT();
  const buckets: { key: keyof Aging; labelKey: string }[] = [
    { key: 'current', labelKey: 'reports.aging.current' },
    { key: 'd1to30', labelKey: 'reports.aging.d1to30' },
    { key: 'd31to60', labelKey: 'reports.aging.d31to60' },
    { key: 'd61to90', labelKey: 'reports.aging.d61to90' },
    { key: 'over90', labelKey: 'reports.aging.over90' },
  ];

  return (
    <View className="gap-1">
      {buckets.map((bucket) => (
        <View className="min-h-8 flex-row items-center justify-between gap-3" key={bucket.key}>
          <Text variant="caption" className="text-muted-foreground">
            {t(bucket.labelKey)}
          </Text>
          <Text variant="label" numeric="tabular" className="font-medium text-foreground">
            {formatVND(aging[bucket.key])}
          </Text>
        </View>
      ))}
      <View className="min-h-8 flex-row items-center justify-between gap-3 border-t border-border pt-1">
        <Text variant="caption" className="font-semibold text-foreground">
          {t('reports.aging.total')}
        </Text>
        <Text variant="label" numeric="tabular" className="font-bold text-foreground">
          {formatVND(aging.total)}
        </Text>
      </View>
    </View>
  );
}
