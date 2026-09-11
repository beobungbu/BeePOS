import { Section, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';
import type { TopProduct } from '../../../domain/reports';

interface TopProductsTableProps {
  rows: TopProduct[];
  layout: 'scroll' | 'stacked';
}

export function TopProductsTable({ rows, layout }: TopProductsTableProps) {
  const t = useT();

  return (
    <Section title={t('reports.section.topProducts')}>
      {rows.length === 0 ? (
        <Text tone="muted">{t('reports.empty.noData')}</Text>
      ) : (
        <Table layout={layout}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports.table.product')}</TableHead>
              <TableHead>{t('reports.table.qty')}</TableHead>
              <TableHead>{t('reports.table.revenue')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.productId}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{String(row.qty)}</TableCell>
                <TableCell>{formatVND(row.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}
