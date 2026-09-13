import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  ListGroup,
  ListItem,
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
  useToast,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useScreenHeader } from '../../components/shell/screen-header';
import { StatStrip } from '../../components/stat-strip';
import { Toolbar } from '../../components/toolbar';
import { useCatalogStore } from '../../data/catalog-store';
import { currentCost } from '../../data/costing-store';
import { useInventoryStore } from '../../data/inventory-store';
import { expiringLots, useLotStore } from '../../data/lot-store';
import { currentOrgId } from '../../data/org-store';
import { useReturnsStore } from '../../data/returns-store';
import { stores as allStores } from '../../data/seed';
import { useSessionStore } from '../../data/session-store';
import { formatVND, sum } from '../../domain/money';
import { canViewAllStores } from '../../domain/org';
import type { Lot, WriteOff } from '../../domain/types';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { formatDate } from '../../lib/datetime';
import { fill } from '../orders/lib/fill';
import { daysUntil, EXPIRY_WINDOWS, gradeLot, type ExpiryWindow } from './lib/lots';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'px-6' } as const;

const GRADE_VARIANT = { expired: 'destructive', soon: 'warning', ahead: 'outline' } as const;

/** Minted outside the component: a clock read during render is not idempotent. */
function makeWriteOffId(lotId: string): string {
  return `writeoff-lot-${lotId}-${Date.now()}`;
}

interface WriteOffTarget {
  lot: Lot;
  productName: string;
}

export function ExpiringScreen() {
  const t = useT();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const isDesktop = breakpoint === 'desktop';
  const staff = useSessionStore((state) => state.staff);
  const currentStore = useSessionStore((state) => state.store);
  const products = useCatalogStore((state) => state.products);
  const lots = useLotStore((state) => state.lots);
  const consumeLot = useLotStore((state) => state.consumeLot);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const addWriteOff = useReturnsStore((state) => state.addWriteOff);
  const writeOffs = useReturnsStore((state) => state.writeOffs);

  const canSeeAllStores = canViewAllStores(staff);
  const [scope, setScope] = useState<string>(currentStore?.id ?? allStores[0].id);
  const [windowDays, setWindowDays] = useState<ExpiryWindow>(EXPIRY_WINDOWS[0]);
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<WriteOffTarget | null>(null);
  const [writeOffQty, setWriteOffQty] = useState('0');

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  // One clock for the whole render: grading half the rows against one instant and half against
  // the next would put a row in two buckets at midnight.
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(() => {
    const scoped = lots.filter((lot) => lot.storeId === scope);
    const needle = search.trim().toLowerCase();
    return expiringLots(scoped, now, windowDays).filter((lot) => {
      if (needle.length === 0) return true;
      const product = productById.get(lot.productId);
      return (
        lot.lotCode.toLowerCase().includes(needle) ||
        (product?.name ?? '').toLowerCase().includes(needle) ||
        (product?.sku ?? '').toLowerCase().includes(needle)
      );
    });
  }, [lots, scope, search, windowDays, now, productById]);

  const costOf = (lot: Lot): number =>
    currentCost(lot.productId, lot.storeId) ?? productById.get(lot.productId)?.costPrice ?? 0;

  const expired = rows.filter((lot) => gradeLot(lot, now) === 'expired');
  const soon = rows.filter((lot) => gradeLot(lot, now) === 'soon');
  const later = rows.filter((lot) => gradeLot(lot, now) === 'ahead');
  const totalValue = sum(rows.map((lot) => lot.onHand * costOf(lot)));

  const scopeName = allStores.find((store) => store.id === scope)?.name ?? scope;
  useScreenHeader({
    title: t('inventory.expiring.title'),
    subtitle: `${fill(t('inventory.expiring.subtitle'), { count: rows.length })} · ${scopeName}`,
    backTo: '/inventory',
  });

  const column = {
    product: t('inventory.expiring.columns.product'),
    lot: t('inventory.expiring.columns.lot'),
    expiry: t('inventory.expiring.columns.expiry'),
    onHand: t('inventory.expiring.columns.onHand'),
    cost: t('inventory.expiring.columns.cost'),
    status: t('inventory.expiring.columns.status'),
    actions: t('products.columns.actions'),
  };

  function statusLabel(lot: Lot): string {
    const grade = gradeLot(lot, now);
    if (grade === 'expired' || !lot.expiresAt) return t('inventory.expiring.statusExpired');
    return fill(t('inventory.expiring.statusDays'), { days: daysUntil(lot.expiresAt, now) });
  }

  function openWriteOff(lot: Lot) {
    setTarget({ lot, productName: productById.get(lot.productId)?.name ?? lot.productId });
    setWriteOffQty(String(lot.onHand));
  }

  /**
   * The write-off is three moves that only make sense together: the batch shrinks, the branch's
   * sellable stock shrinks with it, and the log gains the row that explains the difference.
   */
  function handleWriteOff() {
    if (!target) return;
    const qty = Math.min(target.lot.onHand, Math.max(0, Number(writeOffQty) || 0));
    if (qty <= 0) {
      setTarget(null);
      return;
    }

    const writeOff: WriteOff = {
      id: makeWriteOffId(target.lot.id),
      orgId: currentOrgId(),
      storeId: target.lot.storeId,
      productId: target.lot.productId,
      qty,
      reason: 'expired',
      refId: target.lot.id,
      staffId: staff?.id ?? '',
      createdAt: new Date(),
    };

    addWriteOff(writeOff);
    consumeLot(target.lot.id, qty);
    adjustStock(target.lot.productId, target.lot.storeId, -qty, `write-off:${writeOff.id}`);

    setTarget(null);
    toast.show({ title: fill(t('inventory.expiring.writeOffToast'), { qty }), variant: 'success' });
  }

  const storeSelect = (
    <View className={isWide ? 'w-56' : ''}>
      <Select value={scope} onValueChange={setScope} disabled={!canSeeAllStores}>
        <SelectTrigger accessibilityLabel={t('inventory.expiring.storeLabel')}>
          <SelectValue placeholder={t('inventory.expiring.storeLabel')} />
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
  );

  const windowSelect = (
    <View className={isWide ? 'w-48' : ''}>
      <Select
        value={String(windowDays)}
        onValueChange={(value) => setWindowDays(Number(value) as ExpiryWindow)}
      >
        <SelectTrigger accessibilityLabel={t('inventory.expiring.windowLabel')}>
          <SelectValue placeholder={t('inventory.expiring.windowLabel')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30" textValue={t('inventory.expiring.window30')}>
            {t('inventory.expiring.window30')}
          </SelectItem>
          <SelectItem value="60" textValue={t('inventory.expiring.window60')}>
            {t('inventory.expiring.window60')}
          </SelectItem>
        </SelectContent>
      </Select>
    </View>
  );

  const searchField = (
    <View className={isDesktop ? 'w-[260px] min-w-60 shrink' : ''}>
      <SearchInput
        accessibilityLabel={t('inventory.expiring.searchPlaceholder')}
        placeholder={t('inventory.expiring.searchPlaceholder')}
        onChangeText={setSearch}
        onSearch={setSearch}
      />
    </View>
  );

  const stats = (
    <StatStrip
      items={[
        {
          label: t('inventory.expiring.stat.expired'),
          value: fill(t('inventory.expiring.lotCount'), {
            count: expired.length,
            qty: sum(expired.map((lot) => lot.onHand)),
          }),
          tone: 'destructive',
        },
        {
          label: t('inventory.expiring.stat.soon'),
          value: fill(t('inventory.expiring.lotCount'), {
            count: soon.length,
            qty: sum(soon.map((lot) => lot.onHand)),
          }),
          tone: 'warning',
        },
        {
          label: t('inventory.expiring.stat.later'),
          value: fill(t('inventory.expiring.lotCount'), {
            count: later.length,
            qty: sum(later.map((lot) => lot.onHand)),
          }),
        },
        { label: t('inventory.expiring.stat.value'), value: formatVND(totalValue) },
      ]}
    />
  );

  const table = rows.length === 0 ? (
    <EmptyState
      title={t('inventory.expiring.empty')}
      description={t('inventory.expiring.emptyDescription')}
    />
  ) : isWide ? (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead label={column.product}>{column.product}</TableHead>
          <TableHead label={column.lot}>{column.lot}</TableHead>
          <TableHead label={column.expiry}>{column.expiry}</TableHead>
          <TableHead label={column.onHand}>{column.onHand}</TableHead>
          <TableHead label={column.cost}>{column.cost}</TableHead>
          <TableHead label={column.status}>{column.status}</TableHead>
          <TableHead label={column.actions}>{column.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((lot) => {
          const name = productById.get(lot.productId)?.name ?? lot.productId;
          return (
            <TableRow key={lot.id}>
              <TableCell label={column.product}>
                <Text variant="label" className="font-semibold">{name}</Text>
                <Text variant="caption" tone="muted">{productById.get(lot.productId)?.sku ?? ''}</Text>
              </TableCell>
              <TableCell label={column.lot}>
                <Text variant="label" numeric="tabular">{lot.lotCode}</Text>
              </TableCell>
              <TableCell label={column.expiry}>
                <Text variant="label" numeric="tabular">
                  {lot.expiresAt ? formatDate(lot.expiresAt.toISOString()) : t('inventory.lots.noExpiry')}
                </Text>
              </TableCell>
              <TableCell label={column.onHand}>
                <Text variant="label" numeric="tabular" className="w-full text-right">{lot.onHand}</Text>
              </TableCell>
              <TableCell label={column.cost}>
                <Text variant="label" numeric="tabular" className="w-full text-right">{formatVND(costOf(lot))}</Text>
              </TableCell>
              <TableCell label={column.status}>
                <Badge variant={GRADE_VARIANT[gradeLot(lot, now)]}>{statusLabel(lot)}</Badge>
              </TableCell>
              <TableCell label={column.actions}>
                <Button
                  variant="outline"
                  size="sm"
                  accessibilityLabel={`${t('inventory.expiring.writeOff')} ${lot.lotCode}`}
                  onPress={() => openWriteOff(lot)}
                >
                  {t('inventory.expiring.writeOff')}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  ) : (
    <ListGroup>
      {rows.map((lot) => (
        <ListItem
          key={lot.id}
          title={productById.get(lot.productId)?.name ?? lot.productId}
          description={`${lot.lotCode} · ${lot.expiresAt ? formatDate(lot.expiresAt.toISOString()) : t('inventory.lots.noExpiry')} · ${lot.onHand}`}
          onPress={() => openWriteOff(lot)}
          trailing={<Badge variant={GRADE_VARIANT[gradeLot(lot, now)]}>{statusLabel(lot)}</Badge>}
        />
      ))}
    </ListGroup>
  );

  /**
   * Write-off reasons are stored as codes so a record reads back in the reader's language. The
   * codes come from two places (a POS return and this screen), so both dictionaries are tried
   * before the raw value is shown; `t` answers with the key itself when it has no entry.
   */
  function reasonText(code: string): string {
    for (const key of [`returns.reason.${code}`, `inventory.supplierReturns.reason.${code}`]) {
      const translated = t(key);
      if (translated !== key) return translated;
    }
    return code === 'expired' ? t('inventory.expiring.writeOffReasonExpired') : code;
  }

  const writeOffColumn = {
    product: t('inventory.expiring.writeOffLogColumns.product'),
    qty: t('inventory.expiring.writeOffLogColumns.qty'),
    reason: t('inventory.expiring.writeOffLogColumns.reason'),
    date: t('inventory.expiring.writeOffLogColumns.date'),
  };

  // Damaged goods leave no stock movement behind (they were sold before they came back), so the
  // log is the only place the difference is explained. It belongs on this screen because
  // writing off is this screen's action.
  const storeWriteOffs = writeOffs
    .filter((entry) => entry.storeId === scope)
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);

  const writeOffLog = (
    <View className="gap-3">
      <Text variant="heading">{t('inventory.expiring.writeOffLogTitle')}</Text>
      {storeWriteOffs.length === 0 ? (
        <Text tone="muted">{t('inventory.expiring.writeOffLogEmpty')}</Text>
      ) : (
        <Table layout="scroll">
          <TableHeader>
            <TableRow>
              <TableHead label={writeOffColumn.product}>{writeOffColumn.product}</TableHead>
              <TableHead label={writeOffColumn.qty}>{writeOffColumn.qty}</TableHead>
              <TableHead label={writeOffColumn.reason}>{writeOffColumn.reason}</TableHead>
              <TableHead label={writeOffColumn.date}>{writeOffColumn.date}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storeWriteOffs.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell label={writeOffColumn.product}>
                  <Text variant="label" className="font-semibold">
                    {productById.get(entry.productId)?.name ?? entry.productId}
                  </Text>
                </TableCell>
                <TableCell label={writeOffColumn.qty}>
                  <Text variant="label" numeric="tabular" className="w-full text-right">{entry.qty}</Text>
                </TableCell>
                <TableCell label={writeOffColumn.reason}>
                  <Text variant="label">{reasonText(entry.reason)}</Text>
                </TableCell>
                <TableCell label={writeOffColumn.date}>
                  <Text variant="caption" tone="muted" numeric="tabular">
                    {formatDate(entry.createdAt.toISOString())}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </View>
  );

  return (
    <View className="flex-1">
      <View className={`border-b border-border bg-surface ${GUTTER[breakpoint]}`}>
        <Toolbar search={isDesktop ? searchField : undefined} activeFilterCount={windowDays === EXPIRY_WINDOWS[0] ? 0 : 1}>
          {!isDesktop && searchField}
          {windowSelect}
          {storeSelect}
        </Toolbar>
      </View>

      <View className={GUTTER[breakpoint]}>{stats}</View>

      <ScrollView className="min-h-0 flex-1" contentContainerClassName="pb-6">
        <View className={GUTTER[breakpoint]}>{table}</View>
        <View className={`${GUTTER[breakpoint]} pt-0`}>{writeOffLog}</View>
      </ScrollView>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {fill(t('inventory.expiring.writeOffTitle'), { code: target?.lot.lotCode ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('inventory.expiring.writeOffDescription')}</AlertDialogDescription>
          <View className="gap-3 py-2">
            <Text variant="label" className="font-semibold">{target?.productName ?? ''}</Text>
            <Field label={t('inventory.expiring.writeOffQty')} required>
              <Input
                accessibilityLabel={t('inventory.expiring.writeOffQty')}
                value={writeOffQty}
                onChangeText={setWriteOffQty}
                keyboardType="numeric"
              />
            </Field>
            <Text variant="caption" tone="muted">
              {`${t('inventory.expiring.writeOffReason')}: ${t('inventory.expiring.writeOffReasonExpired')}`}
            </Text>
          </View>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleWriteOff}>{t('inventory.expiring.writeOffConfirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
