import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Badge,
  Button,
  EmptyState,
  ListGroup,
  ListItem,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { agingFor, balances, type Aging } from '../../../domain/ledger';
import { formatVND, roundVND } from '../../../domain/money';
import { useCustomerStore } from '../../../data/customer-store';
import { useLedgerStore } from '../../../data/ledger-store';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { StatStrip } from '../../../components/stat-strip';
import { Toolbar } from '../../../components/toolbar';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { MoneyCsvButton } from '../components/money-csv-button';
import { MoneyScreen } from '../components/money-screen';
import { SettlementDialog, type SettlementTarget } from '../components/settlement-dialog';
import { LedgerNoteDialog } from '../components/ledger-note-dialog';

/** Aging columns left to right, and the tone each one is read in. */
const BUCKETS: { key: Exclude<keyof Aging, 'total'>; labelKey: string; tone: string }[] = [
  { key: 'current', labelKey: 'money.receivables.columns.current', tone: 'text-foreground' },
  { key: 'd1to30', labelKey: 'money.receivables.columns.d1to30', tone: 'text-warning' },
  { key: 'd31to60', labelKey: 'money.receivables.columns.d31to60', tone: 'text-destructive' },
  { key: 'd61to90', labelKey: 'money.receivables.columns.d61to90', tone: 'text-destructive' },
  { key: 'over90', labelKey: 'money.receivables.columns.over90', tone: 'text-destructive' },
];

/** A zero cell keeps its column: subtle, never blank (`specs/commerce.md` section D). */
function amountClass(value: number, tone: string): string {
  return value > 0 ? tone : 'text-subtle-foreground';
}

/**
 * `/money/receivables`: who owes the chain money, aged by how many days past due it is rather
 * than by how old the invoice is. A row opens the collection dialog.
 */
export function ReceivablesScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const entries = useLedgerStore((state) => state.entries);
  const customers = useCustomerStore((state) => state.customers);

  const [query, setQuery] = useState('');
  const [collecting, setCollecting] = useState<SettlementTarget | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);

  const rows = useMemo(() => {
    const now = new Date();
    return balances(entries, 'customer', now)
      .filter((row) => row.balance > 0)
      .map((row) => {
        const customer = customers.find((item) => item.id === row.partyId);
        return {
          partyId: row.partyId,
          name: customer?.companyName ?? customer?.name ?? row.partyId,
          meta: customer?.phone ?? '',
          balance: row.balance,
          overdue: row.overdue,
          aging: agingFor(entries, 'customer', row.partyId, now),
        };
      });
  }, [entries, customers]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.name} ${row.meta}`.toLowerCase().includes(needle));
  }, [rows, query]);

  // A note can be raised against any account that buys on credit, not only the ones already in
  // debt: a credit note for goods returned by a customer whose balance is nil is normal.
  const noteCandidates = useMemo(
    () =>
      customers
        .filter((customer) => customer.type === 'company')
        .map((customer) => ({ id: customer.id, name: customer.companyName ?? customer.name })),
    [customers],
  );

  const totals = useMemo(
    () =>
      visible.reduce<Aging>(
        (total, row) => ({
          current: roundVND(total.current + row.aging.current),
          d1to30: roundVND(total.d1to30 + row.aging.d1to30),
          d31to60: roundVND(total.d31to60 + row.aging.d31to60),
          d61to90: roundVND(total.d61to90 + row.aging.d61to90),
          over90: roundVND(total.over90 + row.aging.over90),
          total: roundVND(total.total + row.balance),
        }),
        { current: 0, d1to30: 0, d31to60: 0, d61to90: 0, over90: 0, total: 0 },
      ),
    [visible],
  );

  const overdueCount = visible.filter((row) => row.overdue > 0).length;

  useScreenHeader({
    title: t('money.receivables.title'),
    subtitle: fill(t('money.receivables.subtitle'), { count: visible.length }),
  });

  const stats = [
    { label: t('money.receivables.stats.total'), value: formatVND(totals.total) },
    { label: t('money.receivables.stats.current'), value: formatVND(totals.current) },
    {
      label: t('money.receivables.stats.overdue'),
      value: formatVND(roundVND(totals.total - totals.current)),
      tone: 'destructive' as const,
    },
    { label: t('money.receivables.stats.over90'), value: formatVND(totals.over90), tone: 'destructive' as const },
    { label: t('money.receivables.stats.customers'), value: String(visible.length) },
  ];

  return (
    <MoneyScreen>
      <Toolbar
        search={
          <View className="min-w-60 shrink">
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('money.receivables.searchPlaceholder')}
              accessibilityLabel={t('money.receivables.searchPlaceholder')}
            />
          </View>
        }
        pinned={
          overdueCount > 0 ? (
            <Badge variant="warning">{fill(t('money.receivables.overdueChip'), { count: overdueCount })}</Badge>
          ) : undefined
        }
        actions={
          <MoneyCsvButton
            fileName={t('money.receivables.fileName')}
            build={() => ({
              header: [
                t('money.receivables.columns.customer'),
                ...BUCKETS.map((bucket) => t(bucket.labelKey)),
                t('money.receivables.columns.total'),
              ],
              rows: visible.map((row) => [
                row.name,
                ...BUCKETS.map((bucket) => row.aging[bucket.key]),
                row.balance,
              ]),
            })}
          />
        }
      />

      <StatStrip items={stats} layout={isWide ? 'row' : 'stacked'} />

      {visible.length === 0 ? (
        <EmptyState title={t('money.receivables.empty')} description="" />
      ) : isWide ? (
        <Table layout="scroll">
          <TableHeader>
            <TableRow>
              <TableHead label={t('money.receivables.columns.customer')}>
                {t('money.receivables.columns.customer')}
              </TableHead>
              {BUCKETS.map((bucket) => (
                <TableHead key={bucket.key} label={t(bucket.labelKey)}>
                  {t(bucket.labelKey)}
                </TableHead>
              ))}
              <TableHead label={t('money.receivables.columns.total')}>
                {t('money.receivables.columns.total')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.partyId}>
                <TableCell label={t('money.receivables.columns.customer')}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('money.receivables.collect')} ${row.name}`}
                    onPress={() => setCollecting({ party: 'customer', partyId: row.partyId, name: row.name })}
                  >
                    <Text variant="label" className="font-semibold">{row.name}</Text>
                    <Text variant="caption" tone="muted">{row.meta}</Text>
                  </Pressable>
                </TableCell>
                {BUCKETS.map((bucket) => (
                  <TableCell key={bucket.key} label={t(bucket.labelKey)}>
                    <Text
                      variant="label"
                      numeric="tabular"
                      className={`w-full text-right ${amountClass(row.aging[bucket.key], bucket.tone)}`}
                    >
                      {formatVND(row.aging[bucket.key])}
                    </Text>
                  </TableCell>
                ))}
                <TableCell label={t('money.receivables.columns.total')}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                    {formatVND(row.balance)}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
            {/* The totals row sits inside the table, tinted, as the mockup has it: a total
                printed under the table is a number nobody can line up with its column. */}
            <TableRow className="bg-surface-muted">
              <TableCell label={t('money.receivables.totalRow')}>
                <Text variant="label" className="font-bold">{t('money.receivables.totalRow')}</Text>
              </TableCell>
              {BUCKETS.map((bucket) => (
                <TableCell key={bucket.key} label={t(bucket.labelKey)}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                    {formatVND(totals[bucket.key])}
                  </Text>
                </TableCell>
              ))}
              <TableCell label={t('money.receivables.columns.total')}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(totals.total)}
                </Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <ListGroup>
          {visible.map((row) => (
            <ListItem
              key={row.partyId}
              // The same accessible name the desktop cell gives the action, so a screen reader
              // announces one verb for one job whatever the width.
              accessibilityLabel={`${t('money.receivables.collect')} ${row.name}. ${formatVND(row.balance)}`}
              title={row.name}
              description={
                row.overdue > 0
                  ? `${formatVND(row.balance)} · ${t('money.receivables.stats.overdue')} ${formatVND(row.overdue)}`
                  : formatVND(row.balance)
              }
              onPress={() => setCollecting({ party: 'customer', partyId: row.partyId, name: row.name })}
              trailing={
                row.overdue > 0 ? <Badge variant="destructive">{formatVND(row.overdue)}</Badge> : undefined
              }
            />
          ))}
        </ListGroup>
      )}

      <View className="flex-row flex-wrap items-center gap-2">
        <Button variant="outline" onPress={() => setNoteOpen(true)}>
          {t('money.receivables.note')}
        </Button>
        <Button variant="outline" onPress={() => router.push('/money/debts')}>
          {t('money.nav.debts')}
        </Button>
      </View>
      <Text variant="caption" tone="muted">{t('money.receivables.reconcile')}</Text>

      <SettlementDialog target={collecting} onClose={() => setCollecting(null)} />
      <LedgerNoteDialog
        open={noteOpen}
        party="customer"
        candidates={noteCandidates}
        onClose={() => setNoteOpen(false)}
      />
    </MoneyScreen>
  );
}
