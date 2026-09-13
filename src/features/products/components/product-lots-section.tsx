import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppIcon } from '../../../components/icons';
import { useLotStore } from '../../../data/lot-store';
import { stores as allStores } from '../../../data/seed';
import { useSessionStore } from '../../../data/session-store';
import { useT } from '../../../i18n';
import { formatDate } from '../../../lib/datetime';
import { fill } from '../../orders/lib/fill';
import { expiredOnHand, gradeLot, lotsIn } from '../../inventory/lib/lots';

const GRADE_VARIANT = { expired: 'destructive', soon: 'warning', ahead: 'outline' } as const;

interface ProductLotsSectionProps {
  productId: string;
}

/**
 * The batches of one product at one branch, soonest expiry first, with the warning the sell
 * screen acts on stated in words. Read only: a lot is created by receiving goods and destroyed
 * by selling or writing them off, never by editing the product record.
 */
export function ProductLotsSection({ productId }: ProductLotsSectionProps) {
  const t = useT();
  const lots = useLotStore((state) => state.lots);
  const currentStore = useSessionStore((state) => state.store);
  const [storeId, setStoreId] = useState(currentStore?.id ?? allStores[0].id);
  const now = useMemo(() => new Date(), []);

  const rows = lotsIn(lots, productId, storeId);
  const total = rows.reduce((sum, lot) => sum + lot.onHand, 0);
  const expired = expiredOnHand(rows, now);

  const column = {
    code: t('inventory.lots.columns.code'),
    expiry: t('inventory.lots.columns.expiry'),
    onHand: t('inventory.lots.columns.onHand'),
  };

  return (
    <View className="gap-3">
      <View className="w-full max-w-72">
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger accessibilityLabel={t('inventory.lots.storeLabel')}>
            <SelectValue placeholder={t('inventory.lots.storeLabel')} />
          </SelectTrigger>
          <SelectContent>
            {allStores.map((store) => (
              <SelectItem key={store.id} value={store.id} textValue={store.name}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>

      {rows.length === 0 ? (
        <Text tone="muted">{t('inventory.lots.empty')}</Text>
      ) : (
        <Table layout="scroll">
          <TableHeader>
            <TableRow>
              <TableHead label={column.code}>{column.code}</TableHead>
              <TableHead label={column.expiry}>{column.expiry}</TableHead>
              <TableHead label={column.onHand}>{column.onHand}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell label={column.code}>
                  <Text variant="label" numeric="tabular">{lot.lotCode}</Text>
                </TableCell>
                <TableCell label={column.expiry}>
                  <View className="flex-row items-center gap-2">
                    <Text variant="label" numeric="tabular">
                      {lot.expiresAt ? formatDate(lot.expiresAt.toISOString()) : t('inventory.lots.noExpiry')}
                    </Text>
                    <Badge variant={GRADE_VARIANT[gradeLot(lot, now)]}>
                      {t(`inventory.lots.grade.${gradeLot(lot, now)}`)}
                    </Badge>
                  </View>
                </TableCell>
                <TableCell label={column.onHand}>
                  <Text variant="label" numeric="tabular" className="w-full text-right">{lot.onHand}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell label={t('inventory.lots.total')} colSpan={2}>
                <Text variant="label">{t('inventory.lots.total')}</Text>
              </TableCell>
              <TableCell label={column.onHand}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">{total}</Text>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {expired > 0 && (
        <View className="gap-1 rounded-lg bg-warning/10 p-4">
          <View className="flex-row items-center gap-2">
            <AppIcon name="triangle-alert" tone="warning" />
            <Text variant="label" className="font-semibold text-warning">
              {fill(t('inventory.lots.expiredTitle'), { qty: expired })}
            </Text>
          </View>
          <Text variant="caption" className="text-warning">{t('inventory.lots.expiredBody')}</Text>
        </View>
      )}
    </View>
  );
}
