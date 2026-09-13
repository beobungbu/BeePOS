import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Badge,
  Button,
  EmptyState,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { useTableRowClass } from '../../../components/table-row-density';
import { Toolbar } from '../../../components/toolbar';
import { useCatalogStore } from '../../../data/catalog-store';
import { useCustomerStore } from '../../../data/customer-store';
import { currentOrgId } from '../../../data/org-store';
import { usePricingStore } from '../../../data/pricing-store';
import { formatVND } from '../../../domain/money';
import type { PriceRule } from '../../../domain/types';
import { useT } from '../../../i18n';
import '../../../i18n/pricing.vi';
import '../../../i18n/pricing.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { fill } from '../../orders/lib/fill';
import { PrecedencePanel } from '../components/precedence-panel';
import { PriceRuleDialog } from '../components/price-rule-dialog';
import {
  formatPercentDelta,
  ruleScope,
  sortRules,
  vsBasePercent,
} from '../lib/price-rule-presentation';
import { usePricingGuard } from '../lib/use-pricing-guard';

/**
 * One price list, one row per rule: a product with three quantity tiers is three rows, so the
 * table reads straight down without anything to expand.
 *
 * The precedence list and the customer groups sit in the side pane next to it, because the
 * first question asked of any price is why it is not the price someone expected.
 */
export function PriceListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const breakpoint = useBreakpoint();
  const rowClass = useTableRowClass();
  const guard = usePricingGuard();

  const priceLists = usePricingStore((state) => state.priceLists);
  const priceRules = usePricingStore((state) => state.priceRules);
  const customerGroups = usePricingStore((state) => state.customerGroups);
  const upsertPriceRule = usePricingStore((state) => state.upsertPriceRule);
  const removePriceRule = usePricingStore((state) => state.removePriceRule);
  const products = useCatalogStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);

  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<{ open: boolean; rule?: PriceRule }>({ open: false });

  const list = priceLists.find((item) => item.id === id);
  const nameOf = (productId: string) =>
    products.find((product) => product.id === productId)?.name ?? productId;

  const rules = useMemo(() => {
    const mine = priceRules.filter((rule) => rule.priceListId === id);
    const needle = search.trim().toLowerCase();
    const matching = needle
      ? mine.filter((rule) => {
          const product = products.find((item) => item.id === rule.productId);
          return (
            product?.name.toLowerCase().includes(needle) ||
            product?.sku.toLowerCase().includes(needle)
          );
        })
      : mine;
    return sortRules(matching, nameOf);
    // `nameOf` closes over `products`, which is in the dependency list already.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRules, id, search, products]);

  useScreenHeader({
    title: list?.name ?? t('pricing.title'),
    subtitle: fill(t('pricing.rules.count'), { count: rules.length }),
    backTo: '/pricing',
  });

  if (guard) return guard;

  if (!list || !id) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-4">
        <EmptyState title={t('pricing.lists.notFound')} description={t('pricing.lists.emptyDescription')} />
        <Button variant="outline" onPress={() => router.push('/pricing')}>
          {t('pricing.lists.back')}
        </Button>
      </View>
    );
  }

  const isDesktop = breakpoint === 'desktop';
  const gutter = breakpoint === 'phone' ? 'px-4' : isDesktop ? 'px-6' : 'px-5';
  const customerCountOf = (groupId: string) =>
    customers.filter((customer) => customer.groupId === groupId).length;

  const table =
    rules.length === 0 ? (
      <View className="py-8">
        <EmptyState title={t('pricing.rules.empty')} description={t('pricing.rules.emptyDescription')} />
      </View>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead label={t('pricing.rules.product')}>{t('pricing.rules.product')}</TableHead>
            <TableHead label={t('pricing.rules.unit')}>{t('pricing.rules.unit')}</TableHead>
            <TableHead className="items-end text-right" label={t('pricing.rules.minQty')}>
              {t('pricing.rules.minQty')}
            </TableHead>
            <TableHead className="items-end text-right" label={t('pricing.rules.unitPrice')}>
              {t('pricing.rules.unitPrice')}
            </TableHead>
            <TableHead className="items-end text-right" label={t('pricing.rules.vsBase')}>
              {t('pricing.rules.vsBase')}
            </TableHead>
            <TableHead label={t('pricing.rules.appliesTo')}>{t('pricing.rules.appliesTo')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => {
            const product = products.find((item) => item.id === rule.productId);
            const delta = vsBasePercent(rule.unitPrice, product);
            const scope = ruleScope(t, rule);
            return (
              <TableRow className={rowClass} key={rule.id}>
                <TableCell label={t('pricing.rules.product')}>
                  <Button
                    variant="ghost"
                    className="h-auto items-start px-0"
                    onPress={() => setDialog({ open: true, rule })}
                    accessibilityLabel={`${product?.name ?? rule.productId} ${rule.minQty}`}
                  >
                    <View className="gap-0.5">
                      <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                        {product?.name ?? rule.productId}
                      </Text>
                      <Text variant="caption" className="text-muted-foreground" numeric="tabular">
                        {product?.sku ?? ''}
                      </Text>
                    </View>
                  </Button>
                </TableCell>
                <TableCell label={t('pricing.rules.unit')}>
                  <Text variant="label" className="font-normal text-foreground">
                    {product?.unit ?? ''}
                  </Text>
                </TableCell>
                <TableCell className="items-end text-right" label={t('pricing.rules.minQty')}>
                  <Text variant="label" className="text-right font-normal text-foreground" numeric="tabular">
                    {rule.minQty}
                  </Text>
                </TableCell>
                <TableCell className="items-end text-right" label={t('pricing.rules.unitPrice')}>
                  <Text variant="label" className="text-right font-bold text-foreground" numeric="tabular">
                    {formatVND(rule.unitPrice)}
                  </Text>
                </TableCell>
                <TableCell className="items-end text-right" label={t('pricing.rules.vsBase')}>
                  <Text
                    variant="label"
                    className={`text-right font-normal tabular-nums ${
                      delta !== undefined && delta < 0 ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {delta !== undefined ? formatPercentDelta(delta) : '-'}
                  </Text>
                </TableCell>
                <TableCell label={t('pricing.rules.appliesTo')}>
                  <View className="flex-row">
                    <Badge variant={scope.variant}>{scope.label}</Badge>
                  </View>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );

  const sidePane = (
    <View className={isDesktop ? '' : 'rounded-lg border border-border bg-surface p-4'}>
      <PrecedencePanel groups={customerGroups} customerCountOf={customerCountOf} />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className={`border-b border-border bg-surface ${gutter}`}>
        <Toolbar
          actions={
            <Button onPress={() => setDialog({ open: true })}>{t('pricing.rules.add')}</Button>
          }
          search={
            <View className="w-[300px] min-w-60 shrink">
              <SearchInput
                accessibilityLabel={t('pricing.rules.search')}
                onSearch={setSearch}
                placeholder={t('pricing.rules.search')}
              />
            </View>
          }
        />
      </View>

      {isDesktop ? (
        <View className="min-h-0 flex-1 flex-row">
          <ScrollView className="min-w-0 flex-1" contentContainerClassName="pb-6">
            {table}
          </ScrollView>
          {/* The pane is a fixed column with the scroller inside it, the shape the sell
              screen's cart pane uses: a width class on the `ScrollView` itself is applied to
              its content wrapper and the column takes half the row instead. */}
          <View className="w-[340px] border-l border-border">
            <ScrollView className="flex-1" contentContainerClassName="p-4">
              {sidePane}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName={`gap-4 pb-8 pt-3 ${gutter}`}>
          {table}
          {sidePane}
        </ScrollView>
      )}

      <PriceRuleDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((previous) => ({ ...previous, open }))}
        rule={dialog.rule}
        products={products}
        onSave={({ productId, minQty, unitPrice }) =>
          upsertPriceRule({
            id: dialog.rule?.id ?? `rule-${id}-${productId}-q${minQty}`,
            orgId: currentOrgId(),
            priceListId: id,
            productId,
            minQty,
            unitPrice,
          })
        }
        onRemove={dialog.rule ? () => removePriceRule(dialog.rule!.id) : undefined}
      />
    </View>
  );
}
