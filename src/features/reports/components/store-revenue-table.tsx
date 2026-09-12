import { Progress, Section, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';
import type { StoreRevenue } from '../../../domain/reports';

interface StoreRevenueTableProps {
  rows: StoreRevenue[];
  layout: 'scroll' | 'stacked';
}

export function StoreRevenueTable({ rows, layout }: StoreRevenueTableProps) {
  const t = useT();

  return (
    <Section title={t('reports.section.revenueByStore')}>
      {rows.length === 0 ? (
        <Text tone="muted">{t('reports.empty.noData')}</Text>
      ) : (
        <Table layout={layout}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports.table.store')}</TableHead>
              <TableHead className="items-end text-right">{t('reports.table.orders')}</TableHead>
              <TableHead className="items-end text-right">{t('reports.table.revenue')}</TableHead>
              <TableHead label={t('reports.table.share')}>{t('reports.table.share')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.storeId}>
                <TableCell>
                  <Text variant="label" className="font-semibold">{row.storeName}</Text>
                </TableCell>
                <TableCell className="items-end text-right">
                  <Text variant="label" numeric="tabular">{String(row.orders)}</Text>
                </TableCell>
                <TableCell className="items-end text-right">
                  <Text variant="label" numeric="tabular" className="font-bold">{formatVND(row.revenue)}</Text>
                </TableCell>
                <TableCell label={t('reports.table.share')}>
                  <Progress
                    accessibilityLabel={`${row.storeName}: ${row.sharePercent}%`}
                    value={row.sharePercent}
                    size="sm"
                  />
                  <Text variant="caption" tone="muted">{`${row.sharePercent}%`}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}
