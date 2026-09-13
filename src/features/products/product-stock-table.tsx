import { Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { useInventoryStore } from '../../data/inventory-store';
import { useOrgStore } from '../../data/org-store';
import { availableQty } from '../../domain/inventory';
import { useT } from '../../i18n';

interface ProductStockTableProps {
  productId: string;
  /** `stacked` below 768, where a horizontally scrolling table is never allowed. */
  layout?: 'scroll' | 'stacked';
}

/** Read-only per-store stock table; `minLevel` is the only editable column (threshold policy, not a count). */
export function ProductStockTable({ productId, layout = 'scroll' }: ProductStockTableProps) {
  const t = useT();
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const setMinLevel = useInventoryStore((state) => state.setMinLevel);
  // The branches of the chain this device is signed into, not the demo seed.
  const allStores = useOrgStore((state) => state.stores);
  const rows = allStores.map((store) => ({
    store,
    level: stockLevels.find((level) => level.productId === productId && level.storeId === store.id),
  }));

  return (
    <Table layout={layout}>
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
              <Text numeric="tabular" className="w-full text-right">{level?.onHand ?? 0}</Text>
            </TableCell>
            <TableCell label={t('products.form.stockColumns.reserved')}>
              <Text numeric="tabular" tone="muted" className="w-full text-right">{level?.reserved ?? 0}</Text>
            </TableCell>
            <TableCell label={t('products.form.stockColumns.available')}>
              <Text numeric="tabular" className="w-full text-right font-semibold">{level ? availableQty(level) : 0}</Text>
            </TableCell>
            <TableCell label={t('products.form.stockColumns.minLevel')}>
              {/* One column of identical inputs: the label has to name the row's store, or
                  every field in the table announces as "Định mức tối thiểu". */}
              <Input
                value={String(level?.minLevel ?? 0)}
                onChangeText={(value) => setMinLevel(productId, store.id, Number(value) || 0)}
                keyboardType="numeric"
                editable={level !== undefined}
                accessibilityLabel={`${t('products.form.stockColumns.minLevel')}, ${store.name}`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
