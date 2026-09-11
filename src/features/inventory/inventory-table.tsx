import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { View } from 'react-native';
import type { StockStatus } from '../../domain/inventory';
import { useT } from '../../i18n';
import type { StockRow } from './inventory-list-utils';

const STATUS_VARIANT: Record<StockStatus, 'success' | 'warning' | 'destructive'> = {
  ok: 'success',
  low: 'warning',
  out: 'destructive',
};

interface InventoryTableProps {
  rows: StockRow[];
  showStore: boolean;
  onAdjust: (row: StockRow) => void;
  onHistory: (row: StockRow) => void;
}

export function InventoryTable({ rows, showStore, onAdjust, onHistory }: InventoryTableProps) {
  const t = useT();

  function statusLabel(status: StockStatus): string {
    if (status === 'out') return t('inventory.statusOut');
    if (status === 'low') return t('inventory.statusLow');
    return t('inventory.statusOk');
  }

  return (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead label={t('inventory.columns.product')}>{t('inventory.columns.product')}</TableHead>
          {showStore && <TableHead label={t('products.form.stockColumns.store')}>{t('products.form.stockColumns.store')}</TableHead>}
          <TableHead label={t('inventory.columns.onHand')}>{t('inventory.columns.onHand')}</TableHead>
          <TableHead label={t('inventory.columns.reserved')}>{t('inventory.columns.reserved')}</TableHead>
          <TableHead label={t('inventory.columns.available')}>{t('inventory.columns.available')}</TableHead>
          <TableHead label={t('inventory.columns.minLevel')}>{t('inventory.columns.minLevel')}</TableHead>
          <TableHead label={t('inventory.columns.status')}>{t('inventory.columns.status')}</TableHead>
          <TableHead label={t('products.columns.actions')}>{t('products.columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.level.productId}-${row.level.storeId}`}>
            <TableCell label={t('inventory.columns.product')}>
              <View>
                <Text>{row.product.name}</Text>
                <Text tone="muted">{row.product.sku}</Text>
              </View>
            </TableCell>
            {showStore && (
              <TableCell label={t('products.form.stockColumns.store')}>
                <Text tone="muted">{row.store.name}</Text>
              </TableCell>
            )}
            <TableCell label={t('inventory.columns.onHand')}>
              <Text>{row.level.onHand}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.reserved')}>
              <Text>{row.level.reserved}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.available')}>
              <Text>{row.available}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.minLevel')}>
              <Text tone="muted">{row.level.minLevel}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.status')}>
              <Badge variant={STATUS_VARIANT[row.status]}>{statusLabel(row.status)}</Badge>
            </TableCell>
            <TableCell label={t('products.columns.actions')}>
              <DropdownMenu>
                <DropdownMenuTrigger variant="outline" size="sm">
                  {t('products.columns.actions')}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => onAdjust(row)}>{t('inventory.actionsAdjust')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onHistory(row)}>{t('inventory.actionsHistory')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
