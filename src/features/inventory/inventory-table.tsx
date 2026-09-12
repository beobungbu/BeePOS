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

/**
 * `ok` is neutral on purpose: a solid green badge on every healthy row is noise that hides
 * the two rows that need attention (direction doc section 5, the muted normal state).
 */
const STATUS_VARIANT: Record<StockStatus, 'outline' | 'warning' | 'destructive'> = {
  ok: 'outline',
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
          <TableHead label={t('inventory.columns.onHand')} className="items-end text-right">{t('inventory.columns.onHand')}</TableHead>
          <TableHead label={t('inventory.columns.reserved')} className="items-end text-right">{t('inventory.columns.reserved')}</TableHead>
          <TableHead label={t('inventory.columns.available')} className="items-end text-right">{t('inventory.columns.available')}</TableHead>
          <TableHead label={t('inventory.columns.minLevel')} className="items-end text-right">{t('inventory.columns.minLevel')}</TableHead>
          <TableHead label={t('inventory.columns.status')}>{t('inventory.columns.status')}</TableHead>
          <TableHead label={t('products.columns.actions')}>{t('products.columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.level.productId}-${row.level.storeId}`}>
            <TableCell label={t('inventory.columns.product')}>
              <View className="min-w-0">
                <Text variant="label" className="font-semibold" numberOfLines={2}>{row.product.name}</Text>
                <Text variant="caption" tone="muted" numeric="tabular">{row.product.sku}</Text>
              </View>
            </TableCell>
            {showStore && (
              <TableCell label={t('products.form.stockColumns.store')}>
                <Text variant="label" tone="muted">{row.store.name}</Text>
              </TableCell>
            )}
            <TableCell label={t('inventory.columns.onHand')} className="items-end text-right">
              <Text variant="label" numeric="tabular" className="w-full text-right">{row.level.onHand}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.reserved')} className="items-end text-right">
              <Text variant="label" tone="muted" numeric="tabular" className="w-full text-right">{row.level.reserved}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.available')} className="items-end text-right">
              <Text variant="label" numeric="tabular" className="w-full text-right font-bold">{row.available}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.minLevel')} className="items-end text-right">
              <Text variant="caption" tone="muted" numeric="tabular" className="w-full text-right">{row.level.minLevel}</Text>
            </TableCell>
            <TableCell label={t('inventory.columns.status')}>
              {/* A row makes the badge hug its text; a bare cell child stretches to the column. */}
              <View className="flex-row">
                <Badge variant={STATUS_VARIANT[row.status]}>{statusLabel(row.status)}</Badge>
              </View>
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
