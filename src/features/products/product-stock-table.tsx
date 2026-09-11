import { Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { stores as allStores } from '../../data/seed';
import { useInventoryStore } from '../../data/inventory-store';
import { availableQty } from '../../domain/inventory';
import { useT } from '../../i18n';

interface ProductStockTableProps {
  productId: string;
}

/** Read-only per-store stock table; `minLevel` is the only editable column (threshold policy, not a count). */
export function ProductStockTable({ productId }: ProductStockTableProps) {
  const t = useT();
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const setMinLevel = useInventoryStore((state) => state.setMinLevel);
  const rows = allStores.map((store) => ({
    store,
    level: stockLevels.find((level) => level.productId === productId && level.storeId === store.id),
  }));

  return (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead label={t('products.form.stockColumns.store')}>{t('products.form.stockColumns.store')}</TableHead>
          <TableHead label={t('products.form.stockColumns.onHand')}>{t('products.form.stockColumns.onHand')}</TableHead>
          <TableHead label={t('products.form.stockColumns.reserved')}>{t('products.form.stockColumns.reserved')}</TableHead>
          <TableHead label={t('products.form.stockColumns.available')}>{t('products.form.stockColumns.available')}</TableHead>
          <TableHead label={t('products.form.stockColumns.minLevel')}>{t('products.form.stockColumns.minLevel')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ store, level }) => (
          <TableRow key={store.id}>
            <TableCell label={t('products.form.stockColumns.store')}>
              <Text>{store.name}</Text>
            </TableCell>
            <TableCell label={t('products.form.stockColumns.onHand')}>
              <Text>{level?.onHand ?? 0}</Text>
            </TableCell>
            <TableCell label={t('products.form.stockColumns.reserved')}>
              <Text>{level?.reserved ?? 0}</Text>
            </TableCell>
            <TableCell label={t('products.form.stockColumns.available')}>
              <Text>{level ? availableQty(level) : 0}</Text>
            </TableCell>
            <TableCell label={t('products.form.stockColumns.minLevel')}>
              <Input
                value={String(level?.minLevel ?? 0)}
                onChangeText={(value) => setMinLevel(productId, store.id, Number(value) || 0)}
                keyboardType="numeric"
                editable={level !== undefined}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
