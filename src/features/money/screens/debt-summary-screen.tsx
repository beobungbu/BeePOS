import { useMemo } from 'react';
import { View } from 'react-native';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { agingTotals, balances, entriesForStore, type Aging } from '../../../domain/ledger';
import { formatVND, roundVND, sum } from '../../../domain/money';
import { useLedgerStore } from '../../../data/ledger-store';
import { useOrgStore } from '../../../data/org-store';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { StatStrip } from '../../../components/stat-strip';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useT } from '../../../i18n';
import { MoneyScreen, MoneySectionTitle } from '../components/money-screen';

const BUCKETS: { key: Exclude<keyof Aging, 'total'>; labelKey: string }[] = [
  { key: 'current', labelKey: 'money.receivables.columns.current' },
  { key: 'd1to30', labelKey: 'money.receivables.columns.d1to30' },
  { key: 'd31to60', labelKey: 'money.receivables.columns.d31to60' },
  { key: 'd61to90', labelKey: 'money.receivables.columns.d61to90' },
  { key: 'over90', labelKey: 'money.receivables.columns.over90' },
];

/** Money owed to and by the chain at one branch. */
function debtFor(entries: Parameters<typeof balances>[0]): { receivable: number; payable: number } {
  const receivable = sum(
    balances(entries, 'customer').filter((row) => row.balance > 0).map((row) => row.balance),
  );
  const payable = sum(
    balances(entries, 'supplier').filter((row) => row.balance > 0).map((row) => row.balance),
  );
  return { receivable, payable };
}

/**
 * `/money/debts`: one number per direction for the chain, the same pair per branch, and the
 * aging of both sides.
 *
 * The branch table reads through `entriesForStore`, which counts only documents stamped with a
 * branch. Hand-placed entries and anything raised before branches were stamped fall outside
 * it, so the note under the table says out loud that the branch rows can add up to less than
 * the chain rather than letting the reader discover a gap and mistrust both figures.
 */
export function DebtSummaryScreen() {
  const t = useT();
  const isWide = useBreakpoint() !== 'phone';
  const entries = useLedgerStore((state) => state.entries);
  const stores = useOrgStore((state) => state.stores);

  const chain = useMemo(() => debtFor(entries), [entries]);
  const receivableAging = useMemo(() => agingTotals(entries, 'customer'), [entries]);
  const payableAging = useMemo(() => agingTotals(entries, 'supplier'), [entries]);

  const perStore = useMemo(
    () =>
      stores.map((store) => {
        const scoped = entriesForStore(entries, store.id);
        const debt = debtFor(scoped);
        return { store, ...debt, net: roundVND(debt.receivable - debt.payable) };
      }),
    [entries, stores],
  );

  const storeTotals = {
    receivable: sum(perStore.map((row) => row.receivable)),
    payable: sum(perStore.map((row) => row.payable)),
    net: sum(perStore.map((row) => row.net)),
  };

  useScreenHeader({ title: t('money.debts.title'), subtitle: t('money.debts.subtitle') });

  return (
    <MoneyScreen>
      <StatStrip
        layout={isWide ? 'row' : 'stacked'}
        items={[
          { label: t('money.debts.receivable'), value: formatVND(chain.receivable) },
          { label: t('money.debts.payable'), value: formatVND(chain.payable) },
          {
            label: t('money.debts.net'),
            value: formatVND(roundVND(chain.receivable - chain.payable)),
            tone: chain.receivable >= chain.payable ? ('success' as const) : ('destructive' as const),
          },
        ]}
      />

      <MoneySectionTitle>{t('money.debts.agingTitle')}</MoneySectionTitle>
      <Table layout="scroll">
        <TableHeader>
          <TableRow>
            <TableHead label={t('money.debts.chainTitle')}>{t('money.debts.chainTitle')}</TableHead>
            {BUCKETS.map((bucket) => (
              <TableHead key={bucket.key} label={t(bucket.labelKey)}>{t(bucket.labelKey)}</TableHead>
            ))}
            <TableHead label={t('money.debts.totalRow')}>{t('money.debts.totalRow')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            { label: t('money.debts.receivable'), aging: receivableAging },
            { label: t('money.debts.payable'), aging: payableAging },
          ].map((row) => (
            <TableRow key={row.label}>
              <TableCell label={t('money.debts.chainTitle')}>
                <Text variant="label" className="font-semibold">{row.label}</Text>
              </TableCell>
              {BUCKETS.map((bucket) => (
                <TableCell key={bucket.key} label={t(bucket.labelKey)}>
                  <Text
                    variant="label"
                    numeric="tabular"
                    className={`w-full text-right ${row.aging[bucket.key] > 0 ? 'text-foreground' : 'text-subtle-foreground'}`}
                  >
                    {formatVND(row.aging[bucket.key])}
                  </Text>
                </TableCell>
              ))}
              <TableCell label={t('money.debts.totalRow')}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(row.aging.total)}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MoneySectionTitle>{t('money.debts.storeTitle')}</MoneySectionTitle>
      <Table layout="scroll">
        <TableHeader>
          <TableRow>
            <TableHead label={t('money.debts.columns.store')}>{t('money.debts.columns.store')}</TableHead>
            <TableHead label={t('money.debts.columns.receivable')}>{t('money.debts.columns.receivable')}</TableHead>
            <TableHead label={t('money.debts.columns.payable')}>{t('money.debts.columns.payable')}</TableHead>
            <TableHead label={t('money.debts.columns.net')}>{t('money.debts.columns.net')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {perStore.map((row) => (
            <TableRow key={row.store.id}>
              <TableCell label={t('money.debts.columns.store')}>
                <Text variant="label" className="font-semibold">{row.store.name}</Text>
                <Text variant="caption" tone="muted">{row.store.code}</Text>
              </TableCell>
              <TableCell label={t('money.debts.columns.receivable')}>
                <Text
                  variant="label"
                  numeric="tabular"
                  className={`w-full text-right ${row.receivable > 0 ? 'text-foreground' : 'text-subtle-foreground'}`}
                >
                  {formatVND(row.receivable)}
                </Text>
              </TableCell>
              <TableCell label={t('money.debts.columns.payable')}>
                <Text
                  variant="label"
                  numeric="tabular"
                  className={`w-full text-right ${row.payable > 0 ? 'text-foreground' : 'text-subtle-foreground'}`}
                >
                  {formatVND(row.payable)}
                </Text>
              </TableCell>
              <TableCell label={t('money.debts.columns.net')}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(row.net)}
                </Text>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-surface-muted">
            <TableCell label={t('money.debts.totalRow')}>
              <Text variant="label" className="font-bold">{t('money.debts.totalRow')}</Text>
            </TableCell>
            <TableCell label={t('money.debts.columns.receivable')}>
              <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                {formatVND(storeTotals.receivable)}
              </Text>
            </TableCell>
            <TableCell label={t('money.debts.columns.payable')}>
              <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                {formatVND(storeTotals.payable)}
              </Text>
            </TableCell>
            <TableCell label={t('money.debts.columns.net')}>
              <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                {formatVND(storeTotals.net)}
              </Text>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <View>
        <Text variant="caption" tone="muted">{t('money.debts.note')}</Text>
      </View>
    </MoneyScreen>
  );
}
