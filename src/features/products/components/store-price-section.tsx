import { useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { effectivePrice, hasStoreOverride } from '../../../domain/catalog';
import { formatVND } from '../../../domain/money';
import type { Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { recordAudit } from '../../../data/audit-store';
import { currentOrgId, useOrgStore } from '../../../data/org-store';
import { useCan } from '../../../data/session-store';
import { useStorePriceStore, useStorePrices } from '../../../data/store-price-store';

/**
 * "Giá theo cửa hàng" on the product detail (`docs/design/mockups/chain-ops.html` section 4).
 *
 * One row per branch whether or not it prices the product itself, because the question this
 * section answers is "what does the chain charge for this", and a table that only lists the
 * exceptions makes that a subtraction the reader has to do in their head. The effective price
 * is the bold column: it is the number the till will actually charge.
 */
export function StorePriceSection({ product }: { product: Product }) {
  const t = useT();
  const toast = useToast();
  const isPhone = useBreakpoint() === 'phone';
  const canManage = useCan('catalog.manage');

  const stores = useOrgStore((state) => state.stores);
  const prices = useStorePrices();
  const setStorePrice = useStorePriceStore((state) => state.setStorePrice);
  const clearStorePrice = useStorePriceStore((state) => state.clearStorePrice);

  /** Digits being typed, per store. Absent means "showing the saved value". */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const activeStores = useMemo(() => stores.filter((store) => store.isActive), [stores]);
  const overrideCount = activeStores.filter((store) =>
    hasStoreOverride(product, store.id, prices),
  ).length;

  function handleSave(storeId: string, storeName: string) {
    const draft = drafts[storeId];
    const next = Number(draft);
    if (draft === undefined || draft.trim().length === 0 || !Number.isFinite(next) || next < 0) return;

    const before = effectivePrice(product, storeId, prices);
    setStorePrice({ orgId: currentOrgId(), storeId, productId: product.id, salePrice: next });
    recordAudit({
      action: 'storePrice',
      entity: 'product',
      entityId: product.sku,
      storeId,
      summary: fill(t('chain.audit.summary.storePriceSet'), {
        from: formatVND(before),
        to: formatVND(next),
        store: storeName,
      }),
    });
    setDrafts((previous) => {
      const rest = { ...previous };
      delete rest[storeId];
      return rest;
    });
    toast.show({ title: t('chain.storePrices.savedToast'), variant: 'success' });
  }

  function handleClear(storeId: string, storeName: string) {
    clearStorePrice(storeId, product.id);
    recordAudit({
      action: 'storePrice',
      entity: 'product',
      entityId: product.sku,
      storeId,
      summary: fill(t('chain.audit.summary.storePriceCleared'), {
        store: storeName,
        to: formatVND(product.salePrice),
      }),
    });
    setDrafts((previous) => {
      const rest = { ...previous };
      delete rest[storeId];
      return rest;
    });
    toast.show({ title: t('chain.storePrices.clearedToast'), variant: 'success' });
  }

  return (
    <View className="gap-3">
      {/* The section heading is the `Section` around this; only the count belongs here. */}
      <View className="flex-row items-center justify-end gap-2">
        <Badge variant={overrideCount > 0 ? 'warning' : 'outline'}>
          {overrideCount > 0
            ? fill(t('chain.storePrices.overrideCount'), { count: overrideCount })
            : t('chain.storePrices.noOverride')}
        </Badge>
      </View>

      <Table layout={isPhone ? 'stacked' : 'scroll'}>
        <TableHeader>
          <TableRow>
            <TableHead label={t('chain.storePrices.columns.store')}>{t('chain.storePrices.columns.store')}</TableHead>
            <TableHead label={t('chain.storePrices.columns.basePrice')}>{t('chain.storePrices.columns.basePrice')}</TableHead>
            <TableHead label={t('chain.storePrices.columns.override')}>{t('chain.storePrices.columns.override')}</TableHead>
            <TableHead label={t('chain.storePrices.columns.effective')}>{t('chain.storePrices.columns.effective')}</TableHead>
            <TableHead label={t('chain.storePrices.columns.source')}>{t('chain.storePrices.columns.source')}</TableHead>
            <TableHead label={t('chain.storePrices.columns.actions')}>{t('chain.storePrices.columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeStores.map((store) => {
            const overridden = hasStoreOverride(product, store.id, prices);
            const effective = effectivePrice(product, store.id, prices);
            const saved = overridden ? String(effective) : '';
            const draft = drafts[store.id] ?? saved;
            const dirty = draft !== saved;

            return (
              <TableRow key={store.id}>
                <TableCell label={t('chain.storePrices.columns.store')}>
                  {/* `TableCell` lays its children in a row, so the code and the name need a
                      box of their own or they run together as "HN01Tạp hoá Cầu Giấy". */}
                  <View className="min-w-0">
                    <Text variant="label" className="font-semibold">{store.code}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>{store.name}</Text>
                  </View>
                </TableCell>
                <TableCell label={t('chain.storePrices.columns.basePrice')}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-normal">
                    {formatVND(product.salePrice)}
                  </Text>
                </TableCell>
                <TableCell label={t('chain.storePrices.columns.override')}>
                  <Input
                    value={draft}
                    onChangeText={(value) =>
                      setDrafts((previous) => ({ ...previous, [store.id]: value.replace(/\D/g, '') }))
                    }
                    editable={canManage}
                    keyboardType="numeric"
                    placeholder={t('chain.storePrices.notSet')}
                    className="max-w-40 text-right tabular-nums"
                    accessibilityLabel={fill(t('chain.storePrices.inputLabel'), { store: store.name })}
                  />
                </TableCell>
                <TableCell label={t('chain.storePrices.columns.effective')}>
                  <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                    {formatVND(effective)}
                  </Text>
                </TableCell>
                <TableCell label={t('chain.storePrices.columns.source')}>
                  <Badge variant={overridden ? 'warning' : 'outline'}>
                    {overridden ? t('chain.storePrices.sourceStore') : t('chain.storePrices.sourceChain')}
                  </Badge>
                </TableCell>
                <TableCell label={t('chain.storePrices.columns.actions')}>
                  {/* One control, and which one depends on what the row is for: a branch on
                      the chain price can only be given one, a branch that has one can only be
                      put back. Saving a typed value wins over both while it is being typed. */}
                  {dirty && draft.length > 0 ? (
                    <Button size="sm" disabled={!canManage} onPress={() => handleSave(store.id, store.name)}>
                      {t('chain.storePrices.set')}
                    </Button>
                  ) : overridden ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canManage}
                      onPress={() => handleClear(store.id, store.name)}
                    >
                      {t('chain.storePrices.clear')}
                    </Button>
                  ) : (
                    <Text variant="caption" tone="muted">{t('chain.storePrices.notSet')}</Text>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <View className="gap-1 rounded-lg bg-surface-muted p-3">
        <Text variant="caption" tone="muted">{t('chain.storePrices.hint1')}</Text>
        <Text variant="caption" tone="muted">{t('chain.storePrices.hint2')}</Text>
        <Text variant="caption" tone="muted">{t('chain.storePrices.hint3')}</Text>
      </View>
    </View>
  );
}
