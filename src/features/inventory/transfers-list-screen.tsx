import { Badge, Button, EmptyState, ListGroup, ListItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useInventoryStore } from '../../data/inventory-store';
import { useOrgStore } from '../../data/org-store';
import { useT } from '../../i18n';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { formatDate } from '../../lib/datetime';
import { fill } from '../orders/lib/fill';

const STATUS_VARIANT = { draft: 'outline', sent: 'warning', received: 'success' } as const;

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function TransfersListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const transfers = useInventoryStore((state) => state.stockTransfers);
  // The branches of the chain this device is signed into, not the demo seed.
  const allStores = useOrgStore((state) => state.stores);

  function storeName(storeId: string): string {
    return allStores.find((store) => store.id === storeId)?.name ?? storeId;
  }

  function statusLabel(status: 'draft' | 'sent' | 'received'): string {
    if (status === 'sent') return t('inventory.transfers.statusSent');
    if (status === 'received') return t('inventory.transfers.statusReceived');
    return t('inventory.transfers.statusDraft');
  }

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <View className="flex-row items-center justify-between">
          <Text variant="title">{t('inventory.transfers.title')}</Text>
          <Button onPress={() => router.push('/inventory/transfers/new')}>{t('inventory.transfers.newTransfer')}</Button>
        </View>

        {transfers.length === 0 ? (
          <EmptyState title={t('inventory.transfers.empty')} description="" />
        ) : isWide ? (
          <Table layout="scroll">
            <TableHeader>
              <TableRow>
                <TableHead label={t('inventory.transfers.columns.from')}>{t('inventory.transfers.columns.from')}</TableHead>
                <TableHead label={t('inventory.transfers.columns.to')}>{t('inventory.transfers.columns.to')}</TableHead>
                <TableHead label={t('inventory.transfers.columns.lines')}>{t('inventory.transfers.columns.lines')}</TableHead>
                <TableHead label={t('inventory.transfers.columns.status')}>{t('inventory.transfers.columns.status')}</TableHead>
                <TableHead label={t('inventory.transfers.columns.date')}>{t('inventory.transfers.columns.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell label={t('inventory.transfers.columns.from')}>
                    <Pressable
                      accessibilityLabel={`${t('inventory.transfers.detailTitle')} ${storeName(transfer.fromStoreId)}`}
                      accessibilityRole="button"
                      onPress={() => router.push(`/inventory/transfers/${transfer.id}`)}
                    >
                      <Text variant="label" className="font-semibold">{storeName(transfer.fromStoreId)}</Text>
                    </Pressable>
                  </TableCell>
                  <TableCell label={t('inventory.transfers.columns.to')}>
                    <Text variant="label" tone="muted">{storeName(transfer.toStoreId)}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.transfers.columns.lines')}>
                    <Text variant="label" numeric="tabular" className="w-full text-right">{transfer.lines.length}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.transfers.columns.status')}>
                    <Badge variant={STATUS_VARIANT[transfer.status]}>{statusLabel(transfer.status)}</Badge>
                  </TableCell>
                  <TableCell label={t('inventory.transfers.columns.date')}>
                    <Text variant="caption" tone="muted" numeric="tabular">{formatDate(transfer.createdAt)}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ListGroup>
            {transfers.map((transfer) => (
              <ListItem
                key={transfer.id}
                title={`${storeName(transfer.fromStoreId)} → ${storeName(transfer.toStoreId)}`}
                description={`${fill(t('inventory.lineCount'), { count: transfer.lines.length })} · ${formatDate(transfer.createdAt)}`}
                onPress={() => router.push(`/inventory/transfers/${transfer.id}`)}
                trailing={<Badge variant={STATUS_VARIANT[transfer.status]}>{statusLabel(transfer.status)}</Badge>}
              />
            ))}
          </ListGroup>
        )}
      </View>
    </ScrollView>
  );
}
