import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Badge,
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
import { balances, daysOverdue } from '../../../domain/ledger';
import { formatVND, sum } from '../../../domain/money';
import { useLedgerStore } from '../../../data/ledger-store';
import { useSupplierStore } from '../../../data/supplier-store';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { StatStrip } from '../../../components/stat-strip';
import { Toolbar } from '../../../components/toolbar';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { formatDate } from '../../../lib/datetime';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { MoneyCsvButton } from '../components/money-csv-button';
import { MoneyScreen } from '../components/money-screen';
import { SettlementDialog, type SettlementTarget } from '../components/settlement-dialog';

/**
 * `/money/payables`: the same shape as receivables with the money going the other way, which
 * is what the spec asks for. The status column counts down to the due date, so nobody has to
 * subtract a date from today to see which bill is late.
 */
export function PayablesScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const entries = useLedgerStore((state) => state.entries);
  const suppliers = useSupplierStore((state) => state.suppliers);

  const [query, setQuery] = useState('');
  const [paying, setPaying] = useState<SettlementTarget | null>(null);

  const rows = useMemo(() => {
    const now = new Date();
    return balances(entries, 'supplier', now)
      .filter((row) => row.balance > 0)
      .map((row) => {
        const supplier = suppliers.find((item) => item.id === row.partyId);
        return {
          partyId: row.partyId,
          name: supplier?.name ?? row.partyId,
          meta: supplier?.phone ?? '',
          balance: row.balance,
          overdue: row.overdue,
          dueDate: row.oldestDueDate,
          days: daysOverdue(row.oldestDueDate, now),
        };
      });
  }, [entries, suppliers]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.name} ${row.meta}`.toLowerCase().includes(needle));
  }, [rows, query]);

  const total = sum(visible.map((row) => row.balance));
  const overdue = sum(visible.map((row) => row.overdue));
  const overdueCount = visible.filter((row) => row.overdue > 0).length;

  useScreenHeader({
    title: t('money.payables.title'),
    subtitle: fill(t('money.payables.subtitle'), { count: visible.length }),
  });

  function statusLabel(row: { dueDate?: Date; days: number }): string {
    if (!row.dueDate) return t('money.payables.statusNoDue');
    if (row.days > 0) return fill(t('money.payables.statusOverdue'), { days: row.days });
    if (row.days === 0) return t('money.payables.statusToday');
    return fill(t('money.payables.statusDue'), { days: Math.abs(row.days) });
  }

  const stats = [
    { label: t('money.payables.stats.total'), value: formatVND(total) },
    { label: t('money.payables.stats.current'), value: formatVND(total - overdue) },
    { label: t('money.payables.stats.overdue'), value: formatVND(overdue), tone: 'destructive' as const },
    { label: t('money.payables.stats.suppliers'), value: String(visible.length) },
  ];

  return (
    <MoneyScreen>
      <Toolbar
        search={
          <View className="min-w-60 shrink">
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('money.payables.searchPlaceholder')}
              accessibilityLabel={t('money.payables.searchPlaceholder')}
            />
          </View>
        }
        pinned={
          overdueCount > 0 ? (
            <Badge variant="warning">{fill(t('money.payables.overdueChip'), { count: overdueCount })}</Badge>
          ) : undefined
        }
        actions={
          <MoneyCsvButton
            fileName={t('money.payables.fileName')}
            build={() => ({
              header: [
                t('money.payables.columns.supplier'),
                t('money.payables.columns.dueDate'),
                t('money.payables.columns.status'),
                t('money.payables.columns.total'),
              ],
              rows: visible.map((row) => [
                row.name,
                row.dueDate ? formatDate(row.dueDate.toISOString()) : '',
                statusLabel(row),
                row.balance,
              ]),
            })}
          />
        }
      />

      <StatStrip items={stats} layout={isWide ? 'row' : 'stacked'} />

      {visible.length === 0 ? (
        <EmptyState title={t('money.payables.empty')} description="" />
      ) : isWide ? (
        <Table layout="scroll">
          <TableHeader>
            <TableRow>
              <TableHead label={t('money.payables.columns.supplier')}>{t('money.payables.columns.supplier')}</TableHead>
              <TableHead label={t('money.payables.columns.dueDate')}>{t('money.payables.columns.dueDate')}</TableHead>
              <TableHead label={t('money.payables.columns.status')}>{t('money.payables.columns.status')}</TableHead>
              <TableHead label={t('money.payables.columns.total')}>{t('money.payables.columns.total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.partyId}>
                <TableCell label={t('money.payables.columns.supplier')}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('money.payables.pay')} ${row.name}`}
                    onPress={() => setPaying({ party: 'supplier', partyId: row.partyId, name: row.name })}
                  >
                    <Text variant="label" className="font-semibold">{row.name}</Text>
                    <Text variant="caption" tone="muted" numeric="tabular">{row.meta}</Text>
                  </Pressable>
                </TableCell>
                <TableCell label={t('money.payables.columns.dueDate')}>
                  <Text variant="caption" tone="muted" numeric="tabular">
                    {row.dueDate ? formatDate(row.dueDate.toISOString()) : ''}
                  </Text>
                </TableCell>
                <TableCell label={t('money.payables.columns.status')}>
                  <Badge variant={row.days > 0 ? 'destructive' : 'outline'}>{statusLabel(row)}</Badge>
                </TableCell>
                <TableCell label={t('money.payables.columns.total')}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                    {formatVND(row.balance)}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-surface-muted">
              <TableCell label={t('money.payables.totalRow')}>
                <Text variant="label" className="font-bold">{t('money.payables.totalRow')}</Text>
              </TableCell>
              <TableCell label={t('money.payables.columns.dueDate')}>
                <Text variant="caption" tone="muted"> </Text>
              </TableCell>
              <TableCell label={t('money.payables.columns.status')}>
                <Text variant="caption" tone="muted"> </Text>
              </TableCell>
              <TableCell label={t('money.payables.columns.total')}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(total)}
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
              accessibilityLabel={`${t('money.payables.pay')} ${row.name}. ${formatVND(row.balance)}`}
              title={row.name}
              description={formatVND(row.balance)}
              onPress={() => setPaying({ party: 'supplier', partyId: row.partyId, name: row.name })}
              trailing={<Badge variant={row.days > 0 ? 'destructive' : 'outline'}>{statusLabel(row)}</Badge>}
            />
          ))}
        </ListGroup>
      )}

      <SettlementDialog target={paying} onClose={() => setPaying(null)} />
    </MoneyScreen>
  );
}
