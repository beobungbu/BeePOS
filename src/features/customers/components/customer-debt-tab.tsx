import { View } from 'react-native';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { daysOverdue, openInvoices, type OpenInvoice } from '../../../domain/ledger';
import { formatVND } from '../../../domain/money';
import type { Customer, LedgerEntry } from '../../../domain/types';
import { useT } from '../../../i18n';
import { useTableRowClass } from '../../../components/table-row-density';
import { formatDate } from '../../../lib/datetime';

interface CustomerDebtTabProps {
  customer: Customer;
  entries: LedgerEntry[];
  now?: Date;
}

/**
 * The aging table of `docs/design/specs/commerce.md` section B: one row per open invoice with
 * days overdue as a badge, and the total inside the table rather than in a block underneath.
 *
 * Aging counts **days past the due date**, not the age of the invoice: an invoice raised
 * three months ago on 90 day terms is not late, and a table that called it late would send a
 * collector after a customer who owes nothing yet.
 */
export function CustomerDebtTab({ customer, entries, now = new Date() }: CustomerDebtTabProps) {
  const t = useT();
  const rowClass = useTableRowClass();
  const open = openInvoices(entries, 'customer', customer.id);
  const total = open.reduce((sum, row) => sum + row.openAmount, 0);

  if (customer.type !== 'company') {
    return (
      <View className="py-6">
        <EmptyState title={t('customers.debt.tab')} description={t('customers.debt.retailOnly')} />
      </View>
    );
  }

  if (open.length === 0) {
    return (
      <View className="py-6">
        <EmptyState title={t('customers.debt.tab')} description={t('customers.debt.empty')} />
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Text variant="label" className="font-semibold text-foreground">
        {t('customers.debt.agingTitle')}
      </Text>
      <View className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead label={t('customers.debt.invoice')}>{t('customers.debt.invoice')}</TableHead>
              <TableHead label={t('customers.debt.date')}>{t('customers.debt.date')}</TableHead>
              <TableHead label={t('customers.debt.dueDate')}>{t('customers.debt.dueDate')}</TableHead>
              <TableHead label={t('customers.debt.overdueBy')}>{t('customers.debt.overdueBy')}</TableHead>
              <TableHead className="items-end text-right" label={t('customers.debt.open')}>
                {t('customers.debt.open')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {open.map((row) => (
              <InvoiceRow key={row.entry.id} row={row} now={now} rowClass={rowClass} />
            ))}
            <TableRow className={`${rowClass} bg-surface-muted`}>
              <TableCell label={t('customers.debt.totalRow')}>
                <Text variant="label" className="font-bold text-foreground">
                  {t('customers.debt.totalRow')}
                </Text>
              </TableCell>
              <TableCell label={t('customers.debt.date')}>
                <Text variant="label" className="font-normal text-muted-foreground">
                  {' '}
                </Text>
              </TableCell>
              <TableCell label={t('customers.debt.dueDate')}>
                <Text variant="label" className="font-normal text-muted-foreground">
                  {' '}
                </Text>
              </TableCell>
              <TableCell label={t('customers.debt.overdueBy')}>
                <Text variant="label" className="font-normal text-muted-foreground">
                  {' '}
                </Text>
              </TableCell>
              <TableCell className="items-end text-right" label={t('customers.debt.open')}>
                <Text
                  variant="label"
                  className="text-right font-bold text-foreground"
                  numeric="tabular"
                >
                  {formatVND(total)}
                </Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </View>
      <Text variant="caption" className="text-muted-foreground">
        {t('customers.debt.reconcile')}
      </Text>
    </View>
  );
}

function InvoiceRow({
  row,
  now,
  rowClass,
}: {
  row: OpenInvoice;
  now: Date;
  rowClass: string;
}) {
  const t = useT();
  const late = daysOverdue(row.dueDate, now);
  const label = row.entry.note ?? row.entry.id;

  return (
    <TableRow className={rowClass}>
      <TableCell label={t('customers.debt.invoice')}>
        <View className="gap-0.5">
          <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
            {label}
          </Text>
          <Text variant="caption" className="text-muted-foreground" numeric="tabular">
            {formatVND(row.amount)}
          </Text>
        </View>
      </TableCell>
      <TableCell label={t('customers.debt.date')}>
        <Text variant="label" className="font-normal text-foreground" numeric="tabular">
          {formatDate(row.entry.createdAt.toISOString())}
        </Text>
      </TableCell>
      <TableCell label={t('customers.debt.dueDate')}>
        <Text variant="label" className="font-normal text-foreground" numeric="tabular">
          {row.dueDate ? formatDate(row.dueDate.toISOString()) : '-'}
        </Text>
      </TableCell>
      <TableCell label={t('customers.debt.overdueBy')}>
        <View className="flex-row">
          {late <= 0 ? (
            <Badge variant="outline">{t('customers.debt.notDue')}</Badge>
          ) : (
            <Badge variant={late > 30 ? 'destructive' : 'warning'}>
              {`${late} ${t('customers.debt.daysSuffix')}`}
            </Badge>
          )}
        </View>
      </TableCell>
      <TableCell className="items-end text-right" label={t('customers.debt.open')}>
        <Text variant="label" className="text-right font-bold text-foreground" numeric="tabular">
          {formatVND(row.openAmount)}
        </Text>
      </TableCell>
    </TableRow>
  );
}
