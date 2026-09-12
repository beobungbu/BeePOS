import { Section, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';
import type { CashierPerformance } from '../../../domain/reports';

interface CashierTableProps {
  rows: CashierPerformance[];
  layout: 'scroll' | 'stacked';
}

export function CashierTable({ rows, layout }: CashierTableProps) {
  const t = useT();

  return (
    <Section title={t('reports.section.cashierPerformance')}>
      {rows.length === 0 ? (
        <Text tone="muted">{t('reports.empty.noData')}</Text>
      ) : (
        <Table layout={layout}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports.table.cashier')}</TableHead>
              <TableHead className="items-end text-right">{t('reports.table.orders')}</TableHead>
              <TableHead className="items-end text-right">{t('reports.table.revenue')}</TableHead>
              <TableHead className="items-end text-right">{t('reports.table.avg')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.cashierId}>
                <TableCell>
                  <Text variant="label" className="font-semibold">{row.name}</Text>
                </TableCell>
                <TableCell className="items-end text-right">
                  <Text variant="label" numeric="tabular">{String(row.orders)}</Text>
                </TableCell>
                <TableCell className="items-end text-right">
                  <Text variant="label" numeric="tabular" className="font-bold">{formatVND(row.revenue)}</Text>
                </TableCell>
                <TableCell className="items-end text-right">
                  <Text variant="label" tone="muted" numeric="tabular">{formatVND(row.averageBasket)}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}
