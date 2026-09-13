import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  EmptyState,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { StatStrip } from '../../components/stat-strip';
import { Toolbar } from '../../components/toolbar';
import { formatVND } from '../../domain/money';
import { formatDate } from '../../lib/datetime';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { useInventoryStore } from '../../data/inventory-store';
import { useSupplierHistories, useSuppliers } from '../../data/supplier-store';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'px-6' } as const;

/** Placeholder for a value a supplier does not have yet; never an em dash, per the copy rules. */
const NO_VALUE = '-';

type StatusScope = 'all' | 'active' | 'inactive';

/**
 * The chain's partners (`docs/design/mockups/chain-ops.html` section 3). Same shape as the
 * other admin lists: one toolbar row, the stat strip, a table from tablet up and a `ListGroup`
 * on the phone, so nothing here has to be learned twice.
 *
 * The purchase figures beside each partner are the point of the screen: a supplier row with
 * no receipt count is a contact card, and the shop already has those in a phone.
 */
export function SupplierListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const isDesktop = breakpoint === 'desktop';

  const suppliers = useSuppliers();
  const histories = useSupplierHistories();
  const receipts = useInventoryStore((state) => state.goodsReceipts);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusScope>('active');

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (status === 'active' && !supplier.isActive) return false;
      if (status === 'inactive' && supplier.isActive) return false;
      if (!needle) return true;
      return (
        supplier.name.toLowerCase().includes(needle) ||
        (supplier.phone ?? '').toLowerCase().includes(needle)
      );
    });
  }, [suppliers, search, status]);

  const activeCount = suppliers.filter((supplier) => supplier.isActive).length;
  const bookedReceipts = useMemo(
    () => receipts.filter((receipt) => Boolean(receipt.supplierId)),
    [receipts],
  );
  const totalValue = useMemo(
    () =>
      [...histories.values()].reduce((total, history) => total + history.totalCost, 0),
    [histories],
  );
  const draftCount = bookedReceipts.filter((receipt) => receipt.status === 'draft').length;

  useScreenHeader({
    title: t('chain.suppliers.title'),
    subtitle: fill(t('chain.suppliers.subtitle'), { count: activeCount }),
  });

  const statusSelect = (
    <View className={isWide ? 'w-56' : ''}>
      <Select value={status} onValueChange={(value) => setStatus(value as StatusScope)}>
        <SelectTrigger accessibilityLabel={t('chain.suppliers.statusFilter.label')}>
          <SelectValue placeholder={t('chain.suppliers.statusFilter.all')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" textValue={t('chain.suppliers.statusFilter.all')}>
            {t('chain.suppliers.statusFilter.all')}
          </SelectItem>
          <SelectItem value="active" textValue={t('chain.suppliers.statusFilter.active')}>
            {t('chain.suppliers.statusFilter.active')}
          </SelectItem>
          <SelectItem value="inactive" textValue={t('chain.suppliers.statusFilter.inactive')}>
            {t('chain.suppliers.statusFilter.inactive')}
          </SelectItem>
        </SelectContent>
      </Select>
    </View>
  );

  const searchField = (
    <View className={isDesktop ? 'w-[300px] min-w-60 shrink' : ''}>
      <SearchInput
        accessibilityLabel={t('chain.suppliers.searchPlaceholder')}
        onChangeText={setSearch}
        onSearch={setSearch}
        placeholder={t('chain.suppliers.searchPlaceholder')}
      />
    </View>
  );

  const addButton = (
    <Button onPress={() => router.push('/inventory/suppliers/new')}>
      {t('chain.suppliers.add')}
    </Button>
  );

  const stats = (
    <StatStrip
      layout={isDesktop ? 'row' : 'stacked'}
      items={[
        { label: t('chain.suppliers.stat.count'), value: String(activeCount) },
        { label: t('chain.suppliers.stat.receipts'), value: String(bookedReceipts.length) },
        { label: t('chain.suppliers.stat.value'), value: formatVND(totalValue) },
        {
          label: t('chain.suppliers.stat.drafts'),
          value: String(draftCount),
          tone: draftCount > 0 ? 'warning' : 'foreground',
        },
      ]}
    />
  );

  const list =
    rows.length === 0 ? (
      <EmptyState
        title={suppliers.length === 0 ? t('chain.suppliers.empty') : t('chain.suppliers.noResults')}
        description={suppliers.length === 0 ? t('chain.suppliers.emptyDescription') : ''}
      />
    ) : isWide ? (
      <Table layout="scroll">
        <TableHeader>
          <TableRow>
            <TableHead label={t('chain.suppliers.columns.name')}>{t('chain.suppliers.columns.name')}</TableHead>
            <TableHead label={t('chain.suppliers.columns.phone')}>{t('chain.suppliers.columns.phone')}</TableHead>
            <TableHead label={t('chain.suppliers.columns.receipts')}>{t('chain.suppliers.columns.receipts')}</TableHead>
            <TableHead label={t('chain.suppliers.columns.total')}>{t('chain.suppliers.columns.total')}</TableHead>
            <TableHead label={t('chain.suppliers.columns.lastReceipt')}>{t('chain.suppliers.columns.lastReceipt')}</TableHead>
            <TableHead label={t('chain.suppliers.columns.status')}>{t('chain.suppliers.columns.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((supplier) => {
            const history = histories.get(supplier.id);
            return (
              <TableRow key={supplier.id}>
                <TableCell label={t('chain.suppliers.columns.name')}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('chain.suppliers.detailTitle')} ${supplier.name}`}
                    onPress={() => router.push(`/inventory/suppliers/${supplier.id}`)}
                  >
                    <Text variant="label" className="font-semibold">{supplier.name}</Text>
                    {supplier.address ? (
                      <Text variant="caption" tone="muted" numberOfLines={1}>{supplier.address}</Text>
                    ) : null}
                  </Pressable>
                </TableCell>
                <TableCell label={t('chain.suppliers.columns.phone')}>
                  <Text variant="label" numeric="tabular" className="font-normal">
                    {supplier.phone ?? NO_VALUE}
                  </Text>
                </TableCell>
                <TableCell label={t('chain.suppliers.columns.receipts')}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-normal">
                    {history?.receiptCount ?? 0}
                  </Text>
                </TableCell>
                <TableCell label={t('chain.suppliers.columns.total')}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                    {formatVND(history?.totalCost ?? 0)}
                  </Text>
                </TableCell>
                <TableCell label={t('chain.suppliers.columns.lastReceipt')}>
                  <Text variant="caption" tone="muted" numeric="tabular">
                    {history?.lastReceivedAt ? formatDate(history.lastReceivedAt) : NO_VALUE}
                  </Text>
                </TableCell>
                <TableCell label={t('chain.suppliers.columns.status')}>
                  <Badge variant={supplier.isActive ? 'success' : 'outline'}>
                    {supplier.isActive ? t('chain.suppliers.statusActive') : t('chain.suppliers.statusInactive')}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    ) : (
      <ListGroup>
        {rows.map((supplier) => {
          const history = histories.get(supplier.id);
          return (
            <ListItem
              key={supplier.id}
              title={supplier.name}
              description={`${supplier.phone ?? NO_VALUE} · ${fill(t('chain.suppliers.picker.receiptCount'), {
                count: history?.receiptCount ?? 0,
              })}`}
              onPress={() => router.push(`/inventory/suppliers/${supplier.id}`)}
              trailing={
                <Badge variant={supplier.isActive ? 'success' : 'outline'}>
                  {supplier.isActive ? t('chain.suppliers.statusActive') : t('chain.suppliers.statusInactive')}
                </Badge>
              }
            />
          );
        })}
      </ListGroup>
    );

  if (isDesktop) {
    return (
      <Screen>
        <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
          <View className={`border-b border-border bg-surface ${GUTTER.desktop}`}>
            <Toolbar
              search={searchField}
              actions={addButton}
              activeFilterCount={status === 'active' ? 0 : 1}
            >
              {statusSelect}
            </Toolbar>
          </View>
          <View className={GUTTER.desktop}>{stats}</View>
          <ScrollView className="min-h-0 flex-1" contentContainerClassName="pb-6">
            <View className={GUTTER.desktop}>{list}</View>
          </ScrollView>
        </SafeArea>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView className="flex-1">
          <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
            {searchField}
            <View className={isWide ? 'flex-row items-center gap-2' : 'gap-2'}>
              {statusSelect}
              {addButton}
            </View>
            {stats}
            {list}
          </View>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
