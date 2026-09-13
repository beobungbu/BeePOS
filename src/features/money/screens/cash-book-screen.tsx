import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Badge,
  Button,
  EmptyState,
  ListGroup,
  ListItem,
  SearchInput,
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
import { formatVND } from '../../../domain/money';
import { periodRange, type PeriodKey } from '../../../domain/reports';
import type { CashBookEntry, CashBookKind } from '../../../domain/types';
import { useCustomerStore } from '../../../data/customer-store';
import { useLedgerStore } from '../../../data/ledger-store';
import { useOrderStore } from '../../../data/order-store';
import { useSupplierStore } from '../../../data/supplier-store';
import { useOrgStore } from '../../../data/org-store';
import { useSessionStore } from '../../../data/session-store';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { StatStrip } from '../../../components/stat-strip';
import { Toolbar } from '../../../components/toolbar';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { formatDate, formatTime } from '../../../lib/datetime';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import {
  CASH_BOOK_KINDS,
  cashBookRows,
  cashBookTotals,
  drawerEntries,
  entriesInRange,
  openingBalanceAt,
} from '../lib/cash-book';
import { DepositDialog } from '../components/deposit-dialog';
import { MoneyCsvButton } from '../components/money-csv-button';
import { MoneyScreen } from '../components/money-screen';

const PERIODS: { value: PeriodKey; labelKey: string }[] = [
  { value: 'today', labelKey: 'money.cashBook.periods.today' },
  { value: '7d', labelKey: 'money.cashBook.periods.last7' },
  { value: '30d', labelKey: 'money.cashBook.periods.last30' },
];

/** Kind badges carry the colour of what the money did, per the mockup's badge set. */
const KIND_VARIANT: Record<CashBookKind, 'success' | 'warning' | 'outline'> = {
  sale: 'outline',
  refund: 'warning',
  in: 'success',
  out: 'warning',
  deposit: 'warning',
  collection: 'success',
  supplier_payment: 'warning',
};

/**
 * `/money/cashbook`: every movement of cash at one branch, across shifts.
 *
 * The running balance is the point of the screen, so the rows are listed newest first but the
 * balance is accumulated oldest first from an opening figure that counts everything before the
 * period. That is what makes a cash count traceable on a filtered day rather than only on the
 * whole history.
 */
export function CashBookScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const cashBook = useLedgerStore((state) => state.cashBook);
  const bankAccounts = useLedgerStore((state) => state.bankAccounts);
  const ledgerEntries = useLedgerStore((state) => state.entries);
  const orders = useOrderStore((state) => state.orders);
  const customers = useCustomerStore((state) => state.customers);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const stores = useOrgStore((state) => state.stores);
  const staffList = useOrgStore((state) => state.staff);
  const sessionStore = useSessionStore((state) => state.store);

  const [storeId, setStoreId] = useState(sessionStore?.id ?? stores[0]?.id ?? '');
  const [periodKey, setPeriodKey] = useState<PeriodKey>('30d');
  const [kind, setKind] = useState<CashBookKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);

  const orderCodeById = useMemo(() => new Map(orders.map((order) => [order.id, order.code])), [orders]);
  /** Who a collection or a supplier payment was with, found through the ledger entry it names. */
  const partyNameFor = (ledgerEntryId?: string): string | undefined => {
    const entry = ledgerEntries.find((row) => row.id === ledgerEntryId);
    if (!entry) return undefined;
    if (entry.party === 'customer') {
      const customer = customers.find((row) => row.id === entry.partyId);
      return customer?.companyName ?? customer?.name;
    }
    return suppliers.find((row) => row.id === entry.partyId)?.name;
  };

  const storeName = stores.find((store) => store.id === storeId)?.name ?? storeId;
  const staffName = (staffId: string): string =>
    staffList.find((member) => member.id === staffId)?.name ?? staffId;
  const accountLabel = (bankAccountId?: string): string | undefined => {
    const account = bankAccounts.find((item) => item.id === bankAccountId);
    return account ? `${account.bank} · ${account.number}` : undefined;
  };

  // What the row is about, not what kind it is: the kind already has its own badge column, so
  // repeating it here would waste the widest column on the table.
  const description = (entry: CashBookEntry): string => {
    if (entry.kind === 'deposit') return accountLabel(entry.bankAccountId) ?? t('money.cashBook.kinds.deposit');
    if (entry.kind === 'sale' || entry.kind === 'refund') {
      return orderCodeById.get(entry.refId ?? '') ?? t(`money.cashBook.kinds.${entry.kind}`);
    }
    if (entry.kind === 'collection' || entry.kind === 'supplier_payment') {
      return partyNameFor(entry.refId) ?? t(`money.cashBook.kinds.${entry.kind}`);
    }
    return accountLabel(entry.bankAccountId) ?? t(`money.cashBook.kinds.${entry.kind}`);
  };

  const view = useMemo(() => {
    const all = drawerEntries(cashBook, storeId);
    const range = periodRange(periodKey, new Date());
    const start = new Date(range.start);
    const end = new Date(range.end);
    const opening = openingBalanceAt(all, start);
    const inRange = entriesInRange(all, start, end);
    const totals = cashBookTotals(inRange, opening);
    const rows = cashBookRows(inRange, opening);
    return { rows, totals };
  }, [cashBook, storeId, periodKey]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return view.rows.filter((row) => {
      if (kind !== 'all' && row.entry.kind !== kind) return false;
      if (!needle) return true;
      return `${description(row.entry)} ${staffName(row.entry.staffId)}`.toLowerCase().includes(needle);
    });
    // `description` and `staffName` read the same store slices the memo below already depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.rows, kind, query, bankAccounts, staffList, ledgerEntries, orders, customers, suppliers]);

  useScreenHeader({
    title: t('money.cashBook.title'),
    subtitle: fill(t('money.cashBook.subtitle'), { store: storeName, count: rows.length }),
  });

  const stats = [
    { label: t('money.cashBook.stats.opening'), value: formatVND(view.totals.opening) },
    { label: t('money.cashBook.stats.inflow'), value: formatVND(view.totals.inflow), tone: 'success' as const },
    { label: t('money.cashBook.stats.outflow'), value: formatVND(view.totals.outflow), tone: 'destructive' as const },
    { label: t('money.cashBook.stats.closing'), value: formatVND(view.totals.closing) },
  ];

  return (
    <MoneyScreen>
      <Toolbar
        search={
          <View className="min-w-60 shrink">
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('money.cashBook.searchPlaceholder')}
              accessibilityLabel={t('money.cashBook.searchPlaceholder')}
            />
          </View>
        }
        activeFilterCount={kind === 'all' ? 0 : 1}
        actions={
          <>
            <MoneyCsvButton
              fileName={t('money.cashBook.fileName')}
              build={() => ({
                header: [
                  t('money.cashBook.columns.time'),
                  t('money.cashBook.columns.kind'),
                  t('money.cashBook.columns.description'),
                  t('money.cashBook.columns.staff'),
                  t('money.cashBook.columns.moneyIn'),
                  t('money.cashBook.columns.moneyOut'),
                  t('money.cashBook.columns.balance'),
                ],
                rows: rows.map((row) => [
                  `${formatDate(row.entry.createdAt.toISOString())} ${formatTime(row.entry.createdAt.toISOString())}`,
                  t(`money.cashBook.kinds.${row.entry.kind}`),
                  description(row.entry),
                  staffName(row.entry.staffId),
                  row.delta > 0 ? row.delta : 0,
                  row.delta < 0 ? -row.delta : 0,
                  row.balance,
                ]),
              })}
            />
            <Button onPress={() => setDepositOpen(true)}>{t('money.deposit.action')}</Button>
          </>
        }
      >
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger className="min-w-40" accessibilityLabel={t('money.cashBook.storeLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodKey} onValueChange={(value) => setPeriodKey(value as PeriodKey)}>
          <SelectTrigger className="min-w-32" accessibilityLabel={t('money.cashBook.periodLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {t(period.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(value) => setKind(value as CashBookKind | 'all')}>
          <SelectTrigger className="min-w-36" accessibilityLabel={t('money.cashBook.kindLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('money.cashBook.kindAll')}</SelectItem>
            {CASH_BOOK_KINDS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`money.cashBook.kinds.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Toolbar>

      <StatStrip items={stats} layout={isWide ? 'row' : 'stacked'} />

      {rows.length === 0 ? (
        <EmptyState title={t('money.cashBook.empty')} description={t('money.cashBook.bankNote')} />
      ) : isWide ? (
        <Table layout="scroll">
          <TableHeader>
            <TableRow>
              <TableHead label={t('money.cashBook.columns.time')}>{t('money.cashBook.columns.time')}</TableHead>
              <TableHead label={t('money.cashBook.columns.kind')}>{t('money.cashBook.columns.kind')}</TableHead>
              <TableHead label={t('money.cashBook.columns.description')}>{t('money.cashBook.columns.description')}</TableHead>
              <TableHead label={t('money.cashBook.columns.staff')}>{t('money.cashBook.columns.staff')}</TableHead>
              <TableHead label={t('money.cashBook.columns.moneyIn')}>{t('money.cashBook.columns.moneyIn')}</TableHead>
              <TableHead label={t('money.cashBook.columns.moneyOut')}>{t('money.cashBook.columns.moneyOut')}</TableHead>
              <TableHead label={t('money.cashBook.columns.balance')}>{t('money.cashBook.columns.balance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.entry.id}>
                <TableCell label={t('money.cashBook.columns.time')}>
                  <Text variant="caption" tone="muted" numeric="tabular">
                    {`${formatDate(row.entry.createdAt.toISOString())} ${formatTime(row.entry.createdAt.toISOString())}`}
                  </Text>
                </TableCell>
                <TableCell label={t('money.cashBook.columns.kind')}>
                  <Badge variant={KIND_VARIANT[row.entry.kind]}>{t(`money.cashBook.kinds.${row.entry.kind}`)}</Badge>
                </TableCell>
                <TableCell label={t('money.cashBook.columns.description')}>
                  <Text variant="label">{description(row.entry)}</Text>
                </TableCell>
                <TableCell label={t('money.cashBook.columns.staff')}>
                  <Text variant="caption" tone="muted">{staffName(row.entry.staffId)}</Text>
                </TableCell>
                <TableCell label={t('money.cashBook.columns.moneyIn')}>
                  <Text
                    variant="label"
                    numeric="tabular"
                    className={`w-full text-right ${row.delta > 0 ? 'text-success' : 'text-subtle-foreground'}`}
                  >
                    {row.delta > 0 ? formatVND(row.delta) : formatVND(0)}
                  </Text>
                </TableCell>
                <TableCell label={t('money.cashBook.columns.moneyOut')}>
                  <Text
                    variant="label"
                    numeric="tabular"
                    className={`w-full text-right ${row.delta < 0 ? 'text-destructive' : 'text-subtle-foreground'}`}
                  >
                    {row.delta < 0 ? formatVND(row.delta) : formatVND(0)}
                  </Text>
                </TableCell>
                <TableCell label={t('money.cashBook.columns.balance')}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                    {formatVND(row.balance)}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <ListGroup>
          {rows.map((row) => (
            <ListItem
              key={row.entry.id}
              title={description(row.entry)}
              description={`${formatTime(row.entry.createdAt.toISOString())} · ${staffName(row.entry.staffId)}`}
              leading={<Badge variant={KIND_VARIANT[row.entry.kind]}>{t(`money.cashBook.kinds.${row.entry.kind}`)}</Badge>}
              trailing={
                <View className="items-end">
                  <Text
                    variant="label"
                    numeric="tabular"
                    className={`font-bold ${row.delta > 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {formatVND(row.delta)}
                  </Text>
                  <Text variant="caption" tone="muted" numeric="tabular">
                    {fill(t('money.cashBook.balanceAfter'), { amount: formatVND(row.balance) })}
                  </Text>
                </View>
              }
            />
          ))}
        </ListGroup>
      )}

      <Text variant="caption" tone="muted">
        {fill(t('money.cashBook.rowCount'), {
          count: rows.length,
          balance: formatVND(view.totals.closing),
        })}
      </Text>
      <Text variant="caption" tone="muted">
        {t('money.cashBook.bankNote')}
      </Text>

      <DepositDialog
        open={depositOpen}
        storeId={storeId}
        drawerBalance={view.totals.closing}
        onClose={() => setDepositOpen(false)}
      />
    </MoneyScreen>
  );
}
