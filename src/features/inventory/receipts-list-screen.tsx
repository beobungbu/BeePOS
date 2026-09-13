import { Badge, Button, EmptyState, ListGroup, ListItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useInventoryStore } from '../../data/inventory-store';
import { useSupplierStore } from '../../data/supplier-store';
import { stores as allStores } from '../../data/seed';
import { receiptTotals } from '../../domain/inventory';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { formatDate } from '../../lib/datetime';

function storeName(storeId: string): string {
  return allStores.find((store) => store.id === storeId)?.name ?? storeId;
}

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function ReceiptsListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const receipts = useInventoryStore((state) => state.goodsReceipts);
  const suppliers = useSupplierStore((state) => state.suppliers);
  // The receipt carries the supplier id only, so the name is always the partner record's
  // current one: renaming a supplier no longer leaves an old name frozen on its receipts.
  const supplierName = (supplierId: string): string =>
    suppliers.find((supplier) => supplier.id === supplierId)?.name ?? supplierId;

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <View className="flex-row items-center justify-between">
          <Text variant="title">{t('inventory.receipts.title')}</Text>
          <Button onPress={() => router.push('/inventory/receipts/new')}>{t('inventory.receipts.newReceipt')}</Button>
        </View>

        {receipts.length === 0 ? (
          <EmptyState title={t('inventory.receipts.empty')} description="" />
        ) : isWide ? (
          <Table layout="scroll">
            <TableHeader>
              <TableRow>
                <TableHead label={t('inventory.receipts.columns.supplier')}>{t('inventory.receipts.columns.supplier')}</TableHead>
                <TableHead label={t('inventory.receipts.columns.lines')}>{t('inventory.receipts.columns.lines')}</TableHead>
                <TableHead label={t('inventory.receipts.columns.total')}>{t('inventory.receipts.columns.total')}</TableHead>
                <TableHead label={t('inventory.receipts.columns.status')}>{t('inventory.receipts.columns.status')}</TableHead>
                <TableHead label={t('inventory.receipts.columns.date')}>{t('inventory.receipts.columns.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell label={t('inventory.receipts.columns.supplier')}>
                    <Pressable
                      accessibilityLabel={`${t('inventory.receipts.detailTitle')} ${supplierName(receipt.supplierId)}`}
                      accessibilityRole="button"
                      onPress={() => router.push(`/inventory/receipts/${receipt.id}`)}
                    >
                      <Text variant="label" className="font-semibold">{supplierName(receipt.supplierId)}</Text>
                      <Text variant="caption" tone="muted">{storeName(receipt.storeId)}</Text>
                    </Pressable>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.lines')}>
                    <Text variant="label" numeric="tabular" className="w-full text-right">{receipt.lines.length}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.total')}>
                    <Text variant="label" numeric="tabular" className="w-full text-right font-bold">{formatVND(receiptTotals(receipt.lines).totalCost)}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.status')}>
                    <Badge variant={receipt.status === 'received' ? 'success' : 'outline'}>
                      {receipt.status === 'received' ? t('inventory.receipts.statusReceived') : t('inventory.receipts.statusDraft')}
                    </Badge>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.date')}>
                    <Text variant="caption" tone="muted" numeric="tabular">{formatDate(receipt.createdAt)}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ListGroup>
            {receipts.map((receipt) => (
              <ListItem
                key={receipt.id}
                title={supplierName(receipt.supplierId)}
                description={`${storeName(receipt.storeId)} · ${formatVND(receiptTotals(receipt.lines).totalCost)}`}
                onPress={() => router.push(`/inventory/receipts/${receipt.id}`)}
                trailing={
                  <Badge variant={receipt.status === 'received' ? 'success' : 'outline'}>
                    {receipt.status === 'received' ? t('inventory.receipts.statusReceived') : t('inventory.receipts.statusDraft')}
                  </Badge>
                }
              />
            ))}
          </ListGroup>
        )}
      </View>
    </ScrollView>
  );
}
