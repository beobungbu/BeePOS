import {
  Badge,
  Button,
  EmptyState,
  ListGroup,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useOrgStore } from '../../data/org-store';
import { usePurchasingStore } from '../../data/purchasing-store';
import { useSupplierStore } from '../../data/supplier-store';
import { formatVND, sum } from '../../domain/money';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useT } from '../../i18n';
import { formatDate } from '../../lib/datetime';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function SupplierReturnsListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const supplierReturns = usePurchasingStore((state) => state.supplierReturns);
  const suppliers = useSupplierStore((state) => state.suppliers);
  // The branches of the chain this device is signed into, not the demo seed.
  const allStores = useOrgStore((state) => state.stores);

  const supplierName = (supplierId: string): string =>
    suppliers.find((supplier) => supplier.id === supplierId)?.name ?? supplierId;

  const storeName = (storeId: string): string =>
    allStores.find((store) => store.id === storeId)?.name ?? storeId;

  useScreenHeader({ title: t('inventory.supplierReturns.title'), backTo: '/inventory' });

  const column = {
    supplier: t('inventory.supplierReturns.columns.supplier'),
    store: t('inventory.supplierReturns.columns.store'),
    lines: t('inventory.supplierReturns.columns.lines'),
    total: t('inventory.supplierReturns.columns.total'),
    status: t('inventory.supplierReturns.columns.status'),
    date: t('inventory.supplierReturns.columns.date'),
  };

  const valueOf = (lines: readonly { qty: number; unitCost: number }[]): number =>
    sum(lines.map((line) => line.qty * line.unitCost));

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <View className="flex-row items-center justify-between">
          <Text variant="title">{t('inventory.supplierReturns.title')}</Text>
          <Button onPress={() => router.push('/inventory/supplier-returns/new')}>
            {t('inventory.supplierReturns.newReturn')}
          </Button>
        </View>

        {supplierReturns.length === 0 ? (
          <EmptyState
            title={t('inventory.supplierReturns.empty')}
            description={t('inventory.supplierReturns.emptyDescription')}
          />
        ) : isWide ? (
          <Table layout="scroll">
            <TableHeader>
              <TableRow>
                <TableHead label={column.supplier}>{column.supplier}</TableHead>
                <TableHead label={column.store}>{column.store}</TableHead>
                <TableHead label={column.lines}>{column.lines}</TableHead>
                <TableHead label={column.total}>{column.total}</TableHead>
                <TableHead label={column.status}>{column.status}</TableHead>
                <TableHead label={column.date}>{column.date}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplierReturns.map((record) => (
                <TableRow key={record.id}>
                  <TableCell label={column.supplier}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t('inventory.supplierReturns.detailTitle')} ${supplierName(record.supplierId)}`}
                      onPress={() => router.push(`/inventory/supplier-returns/${record.id}`)}
                    >
                      <Text variant="label" className="font-semibold">{supplierName(record.supplierId)}</Text>
                    </Pressable>
                  </TableCell>
                  <TableCell label={column.store}>
                    <Text variant="label">{storeName(record.storeId)}</Text>
                  </TableCell>
                  <TableCell label={column.lines}>
                    <Text variant="label" numeric="tabular" className="w-full text-right">{record.lines.length}</Text>
                  </TableCell>
                  <TableCell label={column.total}>
                    <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                      {formatVND(valueOf(record.lines))}
                    </Text>
                  </TableCell>
                  <TableCell label={column.status}>
                    <Badge variant={record.status === 'sent' ? 'success' : 'outline'}>
                      {t(`inventory.supplierReturns.status.${record.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell label={column.date}>
                    <Text variant="caption" tone="muted" numeric="tabular">
                      {formatDate(record.createdAt.toISOString())}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ListGroup>
            {supplierReturns.map((record) => (
              <ListItem
                key={record.id}
                title={supplierName(record.supplierId)}
                description={`${storeName(record.storeId)} · ${formatVND(valueOf(record.lines))}`}
                onPress={() => router.push(`/inventory/supplier-returns/${record.id}`)}
                trailing={
                  <Badge variant={record.status === 'sent' ? 'success' : 'outline'}>
                    {t(`inventory.supplierReturns.status.${record.status}`)}
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
