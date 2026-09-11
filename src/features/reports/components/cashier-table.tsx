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
              <TableHead>{t('reports.table.orders')}</TableHead>
              <TableHead>{t('reports.table.revenue')}</TableHead>
              <TableHead>{t('reports.table.avg')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.cashierId}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{String(row.orders)}</TableCell>
                <TableCell>{formatVND(row.revenue)}</TableCell>
                <TableCell>{formatVND(row.averageBasket)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}
