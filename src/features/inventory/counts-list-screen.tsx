import { Badge, Button, EmptyState, ListGroup, ListItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useInventoryStore } from '../../data/inventory-store';
import { stores as allStores } from '../../data/seed';
import { useT } from '../../i18n';
import { useIsWide } from './hooks/use-is-wide';

function storeName(storeId: string): string {
  return allStores.find((store) => store.id === storeId)?.name ?? storeId;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function CountsListScreen() {
  const t = useT();
  const isWide = useIsWide();
  const counts = useInventoryStore((state) => state.stockCounts);

  return (
    <ScrollView className="flex-1">
      <View className="flex-1 gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="title">{t('inventory.counts.title')}</Text>
          <Button onPress={() => router.push('/inventory/counts/new')}>{t('inventory.counts.newCount')}</Button>
        </View>

        {counts.length === 0 ? (
          <EmptyState title={t('inventory.counts.empty')} description="" />
        ) : isWide ? (
          <Table layout="scroll">
            <TableHeader>
              <TableRow>
                <TableHead label={t('inventory.counts.columns.store')}>{t('inventory.counts.columns.store')}</TableHead>
                <TableHead label={t('inventory.counts.columns.lines')}>{t('inventory.counts.columns.lines')}</TableHead>
                <TableHead label={t('inventory.counts.columns.status')}>{t('inventory.counts.columns.status')}</TableHead>
                <TableHead label={t('inventory.counts.columns.date')}>{t('inventory.counts.columns.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counts.map((count) => (
                <TableRow key={count.id}>
                  <TableCell label={t('inventory.counts.columns.store')}>
                    <Pressable onPress={() => router.push(`/inventory/counts/${count.id}`)}>
                      <Text>{storeName(count.storeId)}</Text>
                    </Pressable>
                  </TableCell>
                  <TableCell label={t('inventory.counts.columns.lines')}>
                    <Text>{count.lines.length}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.counts.columns.status')}>
                    <Badge variant={count.status === 'posted' ? 'success' : 'outline'}>
                      {count.status === 'posted' ? t('inventory.counts.statusPosted') : t('inventory.counts.statusDraft')}
                    </Badge>
                  </TableCell>
                  <TableCell label={t('inventory.counts.columns.date')}>
                    <Text tone="muted">{formatDate(count.createdAt)}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ListGroup>
            {counts.map((count) => (
              <ListItem
                key={count.id}
                title={storeName(count.storeId)}
                description={`${count.lines.length} dòng · ${formatDate(count.createdAt)}`}
                onPress={() => router.push(`/inventory/counts/${count.id}`)}
                trailing={
                  <Badge variant={count.status === 'posted' ? 'success' : 'outline'}>
                    {count.status === 'posted' ? t('inventory.counts.statusPosted') : t('inventory.counts.statusDraft')}
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
