import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { agingFor, balances, type Aging } from '../../domain/ledger';
import { formatVND, roundVND } from '../../domain/money';
import type { CashBookEntry, CashBookKind, LedgerEntry } from '../../domain/types';
import { cashBookRows, cashDirection } from '../money/lib/cash-book';

/**
 * The two long money tables of phase 7, measured the way the sell screen's grid is: the same
 * arithmetic and the same row shape as the shipped screens, over a synthetic set of rows held
 * in memory by the harness.
 *
 * Neither table may write to `ledger-store`: `persistence-bootstrap` subscribes to it, so a
 * thousand invoices would be serialised into the demo's storage on a debounce timer and a JSON
 * stringify would land in the middle of the frame measurement. The rows are therefore built
 * here and passed as data, exactly as `buildPerfCatalog` does for the product grid.
 *
 * `Table` renders every row it is given (`visible.map` in both shipped screens, no windowing),
 * which is the thing worth measuring: the cost is paid up front, at the first paint, not on
 * scroll.
 */

const PERF_ORG_ID = 'perf-org';
const PERF_STORE_ID = 'perf-store';
const DAY_MS = 86_400_000;

/** A fixed instant so a run is reproducible; the aging spread is relative to it. */
function anchor(): Date {
  return new Date(Date.UTC(2026, 8, 13, 2, 0, 0));
}

/**
 * `count` customers who owe money, aged across all five buckets: one invoice each, due between
 * 120 days ago and 30 days ahead, and a part payment on every third account so the aging has
 * partly settled invoices in it like the real ledger does.
 */
export function buildReceivableEntries(count: number, now: Date = anchor()): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    const partyId = `perf-customer-${index + 1}`;
    // 0, 12, 24 ... 144 days past due, wrapping: every bucket including "not yet due".
    const daysPastDue = ((index * 12) % 150) - 30;
    const createdAt = new Date(now.getTime() - (daysPastDue + 30) * DAY_MS);
    const dueDate = new Date(now.getTime() - daysPastDue * DAY_MS);
    const amount = roundVND(1_000_000 + index * 1_000);
    const invoiceId = `perf-ar-${index + 1}`;
    entries.push({
      id: invoiceId,
      orgId: PERF_ORG_ID,
      storeId: PERF_STORE_ID,
      party: 'customer',
      partyId,
      kind: 'invoice',
      refType: 'order',
      refId: `perf-order-${index + 1}`,
      amount,
      dueDate,
      createdAt,
    });
    if (index % 3 === 0) {
      entries.push({
        id: `perf-ar-pay-${index + 1}`,
        orgId: PERF_ORG_ID,
        storeId: PERF_STORE_ID,
        party: 'customer',
        partyId,
        kind: 'payment',
        refType: 'manual',
        refId: invoiceId,
        amount: roundVND(amount * 0.4),
        createdAt: new Date(createdAt.getTime() + 5 * DAY_MS),
      });
    }
  }
  return entries;
}

/** `count` drawer movements at one branch, oldest first, cycling every cash-book kind. */
export function buildCashBookEntries(count: number, now: Date = anchor()): CashBookEntry[] {
  const kinds: CashBookKind[] = ['sale', 'sale', 'sale', 'refund', 'in', 'out', 'collection', 'supplier_payment'];
  const entries: CashBookEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    const kind = kinds[index % kinds.length];
    entries.push({
      id: `perf-cash-${index + 1}`,
      orgId: PERF_ORG_ID,
      storeId: PERF_STORE_ID,
      kind,
      amount: roundVND(20_000 + (index % 47) * 13_000),
      refId: `perf-ref-${index + 1}`,
      staffId: `perf-staff-${(index % 6) + 1}`,
      // Newest last, one row every eleven minutes, so the running balance has a real order.
      createdAt: new Date(now.getTime() - (count - index) * 11 * 60_000),
    });
  }
  return entries;
}

const BUCKETS: { key: Exclude<keyof Aging, 'total'>; label: string; tone: string }[] = [
  { key: 'current', label: 'Chưa đến hạn', tone: 'text-foreground' },
  { key: 'd1to30', label: '1-30 ngày', tone: 'text-warning' },
  { key: 'd31to60', label: '31-60', tone: 'text-destructive' },
  { key: 'd61to90', label: '61-90', tone: 'text-destructive' },
  { key: 'over90', label: 'Trên 90', tone: 'text-destructive' },
];

interface PerfTableProps {
  rows: number;
}

/**
 * `/money/receivables` at `rows` customers: `balances()` then `agingFor()` per row, which is
 * what the shipped screen does, then one `TableRow` per account with the five aging columns.
 */
export function ReceivablesPerfTable({ rows }: PerfTableProps) {
  const entries = useMemo(() => buildReceivableEntries(rows), [rows]);

  const tableRows = useMemo(() => {
    const now = anchor();
    return balances(entries, 'customer', now)
      .filter((row) => row.balance > 0)
      .map((row) => ({
        partyId: row.partyId,
        name: `Khách công nợ ${row.partyId.replace('perf-customer-', '')}`,
        meta: '0913 000 000',
        balance: row.balance,
        aging: agingFor(entries, 'customer', row.partyId, now),
      }));
  }, [entries]);

  return (
    <ScrollView className="flex-1 bg-surface" testID="perf-receivables-scroll">
      <Table layout="scroll">
        <TableHeader>
          <TableRow>
            <TableHead label="Khách hàng">Khách hàng</TableHead>
            {BUCKETS.map((bucket) => (
              <TableHead key={bucket.key} label={bucket.label}>
                {bucket.label}
              </TableHead>
            ))}
            <TableHead label="Tổng nợ">Tổng nợ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows.map((row) => (
            <TableRow key={row.partyId}>
              <TableCell label="Khách hàng">
                <Text variant="label" className="font-semibold">
                  {row.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {row.meta}
                </Text>
              </TableCell>
              {BUCKETS.map((bucket) => (
                <TableCell key={bucket.key} label={bucket.label}>
                  <Text
                    variant="label"
                    numeric="tabular"
                    className={`w-full text-right ${row.aging[bucket.key] > 0 ? bucket.tone : 'text-subtle-foreground'}`}
                  >
                    {formatVND(row.aging[bucket.key])}
                  </Text>
                </TableCell>
              ))}
              <TableCell label="Tổng nợ">
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(row.balance)}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollView>
  );
}

const KIND_VARIANT: Record<CashBookKind, 'success' | 'warning' | 'outline'> = {
  sale: 'outline',
  refund: 'warning',
  in: 'success',
  out: 'warning',
  deposit: 'outline',
  collection: 'success',
  supplier_payment: 'warning',
};

const KIND_LABEL: Record<CashBookKind, string> = {
  sale: 'Bán hàng',
  refund: 'Hoàn tiền',
  in: 'Thu khác',
  out: 'Chi khác',
  deposit: 'Nộp ngân hàng',
  collection: 'Thu nợ',
  supplier_payment: 'Trả nhà cung cấp',
};

/** `/money/cashbook` at `rows` movements: the running balance column and a badge per row. */
export function CashBookPerfTable({ rows }: PerfTableProps) {
  const entries = useMemo(() => buildCashBookEntries(rows), [rows]);
  const tableRows = useMemo(() => cashBookRows(entries, 0), [entries]);

  return (
    <ScrollView className="flex-1 bg-surface" testID="perf-cashbook-scroll">
      <Table layout="scroll">
        <TableHeader>
          <TableRow>
            <TableHead label="Giờ">Giờ</TableHead>
            <TableHead label="Loại">Loại</TableHead>
            <TableHead label="Diễn giải">Diễn giải</TableHead>
            <TableHead label="Thu">Thu</TableHead>
            <TableHead label="Chi">Chi</TableHead>
            <TableHead label="Số dư">Số dư</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows.map((row) => (
            <TableRow key={row.entry.id}>
              <TableCell label="Giờ">
                <Text variant="caption" tone="muted" numeric="tabular">
                  {row.entry.createdAt.toISOString().slice(5, 16).replace('T', ' ')}
                </Text>
              </TableCell>
              <TableCell label="Loại">
                <View className="flex-row">
                  <Badge variant={KIND_VARIANT[row.entry.kind]}>{KIND_LABEL[row.entry.kind]}</Badge>
                </View>
              </TableCell>
              <TableCell label="Diễn giải">
                <Text variant="label">{`${KIND_LABEL[row.entry.kind]} ${row.entry.refId ?? ''}`}</Text>
              </TableCell>
              <TableCell label="Thu">
                <Text
                  variant="label"
                  numeric="tabular"
                  className={`w-full text-right ${row.delta > 0 ? 'text-success' : 'text-subtle-foreground'}`}
                >
                  {cashDirection(row.entry.kind) === 1 ? formatVND(row.entry.amount) : '—'}
                </Text>
              </TableCell>
              <TableCell label="Chi">
                <Text
                  variant="label"
                  numeric="tabular"
                  className={`w-full text-right ${row.delta < 0 ? 'text-destructive' : 'text-subtle-foreground'}`}
                >
                  {cashDirection(row.entry.kind) === -1 ? formatVND(row.entry.amount) : '—'}
                </Text>
              </TableCell>
              <TableCell label="Số dư">
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(row.balance)}
                </Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollView>
  );
}
