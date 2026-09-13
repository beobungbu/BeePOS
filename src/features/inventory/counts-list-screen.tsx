import { Badge, Button, EmptyState, ListGroup, ListItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useInventoryStore } from '../../data/inventory-store';
import { useOrgStore } from '../../data/org-store';
import { useT } from '../../i18n';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { formatDate } from '../../lib/datetime';
import { fill } from '../orders/lib/fill';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function CountsListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const counts = useInventoryStore((state) => state.stockCounts);
  // The branches of the chain this device is signed into, not the demo seed.
  const allStores = useOrgStore((state) => state.stores);

  function storeName(storeId: string): string {
    return allStores.find((store) => store.id === storeId)?.name ?? storeId;
  }

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
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
                    <Pressable
                      accessibilityLabel={`${t('inventory.counts.detailTitle')} ${storeName(count.storeId)}`}
                      accessibilityRole="button"
                      onPress={() => router.push(`/inventory/counts/${count.id}`)}
                    >
                      <Text variant="label" className="font-semibold">{storeName(count.storeId)}</Text>
                    </Pressable>
                  </TableCell>
                  <TableCell label={t('inventory.counts.columns.lines')}>
                    <Text variant="label" numeric="tabular" className="w-full text-right">{count.lines.length}</Text>
                  </TableCell>
                  <TableCell label={t('inventory.counts.columns.status')}>
                    <Badge variant={count.status === 'posted' ? 'success' : 'outline'}>
                      {count.status === 'posted' ? t('inventory.counts.statusPosted') : t('inventory.counts.statusDraft')}
                    </Badge>
                  </TableCell>
                  <TableCell label={t('inventory.counts.columns.date')}>
                    <Text variant="caption" tone="muted" numeric="tabular">{formatDate(count.createdAt)}</Text>
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
                description={`${fill(t('inventory.lineCount'), { count: count.lines.length })} · ${formatDate(count.createdAt)}`}
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
