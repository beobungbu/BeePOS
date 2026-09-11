import { Badge, Button, EmptyState, ListGroup, ListItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useInventoryStore } from '../../data/inventory-store';
import { stores as allStores } from '../../data/seed';
import { receiptTotals } from '../../domain/inventory';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { useIsWide } from './hooks/use-is-wide';

function storeName(storeId: string): string {
  return allStores.find((store) => store.id === storeId)?.name ?? storeId;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function ReceiptsListScreen() {
  const t = useT();
  const isWide = useIsWide();
  const receipts = useInventoryStore((state) => state.goodsReceipts);

  return (
    <ScrollView className="flex-1">
      <View className="flex-1 gap-4 p-4">
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
                    <Pressable onPress={() => router.push(`/inventory/receipts/${receipt.id}`)}>
                      <Text>{receipt.supplierName}</Text>
                      <Text tone="muted">{storeName(receipt.storeId)}</Text>
                    </Pressable>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.lines')}>
                    <Text>{receipt.lines.length}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.total')}>
                    <Text>{formatVND(receiptTotals(receipt.lines).totalCost)}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.status')}>
                    <Badge variant={receipt.status === 'received' ? 'success' : 'outline'}>
                      {receipt.status === 'received' ? t('inventory.receipts.statusReceived') : t('inventory.receipts.statusDraft')}
                    </Badge>
                  </TableCell>
                  <TableCell label={t('inventory.receipts.columns.date')}>
                    <Text tone="muted">{formatDate(receipt.createdAt)}</Text>
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
                title={receipt.supplierName}
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
