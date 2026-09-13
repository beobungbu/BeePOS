import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Badge,
  Button,
  EmptyState,
  ListGroup,
  ListItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { useCustomerStore } from '../../../data/customer-store';
import { usePricingStore } from '../../../data/pricing-store';
import { currentOrgId } from '../../../data/org-store';
import type { CustomerGroup, PriceList } from '../../../domain/types';
import { useT } from '../../../i18n';
import '../../../i18n/pricing.vi';
import '../../../i18n/pricing.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { fill } from '../../orders/lib/fill';
import { CustomerGroupDialog } from '../components/customer-group-dialog';
import { PriceListDialog } from '../components/price-list-dialog';
import { usePricingGuard } from '../lib/use-pricing-guard';

/**
 * The pricing home: the price lists a chain sells on, and the customer groups that point at
 * them. One screen with two tabs rather than two areas, because a group is only meaningful
 * through the list it names and nobody edits one without looking at the other.
 */
export function PricingScreen() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const guard = usePricingGuard();

  const priceLists = usePricingStore((state) => state.priceLists);
  const priceRules = usePricingStore((state) => state.priceRules);
  const customerGroups = usePricingStore((state) => state.customerGroups);
  const upsertPriceList = usePricingStore((state) => state.upsertPriceList);
  const upsertCustomerGroup = usePricingStore((state) => state.upsertCustomerGroup);
  const customers = useCustomerStore((state) => state.customers);

  const [tab, setTab] = useState<'lists' | 'groups'>('lists');
  const [listDialog, setListDialog] = useState<{ open: boolean; list?: PriceList }>({ open: false });
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; group?: CustomerGroup }>({
    open: false,
  });

  const ruleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rule of priceRules) {
      if (!rule.priceListId) continue;
      counts.set(rule.priceListId, (counts.get(rule.priceListId) ?? 0) + 1);
    }
    return counts;
  }, [priceRules]);

  const customerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const customer of customers) {
      if (!customer.groupId) continue;
      counts.set(customer.groupId, (counts.get(customer.groupId) ?? 0) + 1);
    }
    return counts;
  }, [customers]);

  useScreenHeader({
    title: t('pricing.title'),
    subtitle: fill(t('pricing.subtitle'), {
      lists: priceLists.length,
      groups: customerGroups.length,
    }),
  });

  if (guard) return guard;

  const gutter = breakpoint === 'phone' ? 'px-4' : breakpoint === 'tablet' ? 'px-5' : 'px-6';

  const groupsUsing = (priceListId: string) =>
    customerGroups.filter((group) => group.priceListId === priceListId).length;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName={`gap-4 pb-8 pt-3 ${gutter}`}>
      <Tabs onValueChange={(value) => setTab(value as typeof tab)} value={tab}>
        <TabsList>
          <TabsTrigger value="lists">{t('pricing.tabs.lists')}</TabsTrigger>
          <TabsTrigger value="groups">{t('pricing.tabs.groups')}</TabsTrigger>
        </TabsList>

        <TabsContent value="lists">
          <View className="gap-3">
            <View className="flex-row justify-end">
              <Button onPress={() => setListDialog({ open: true })}>{t('pricing.lists.add')}</Button>
            </View>
            {priceLists.length === 0 ? (
              <EmptyState
                title={t('pricing.lists.empty')}
                description={t('pricing.lists.emptyDescription')}
              />
            ) : (
              <ListGroup>
                {priceLists.map((list) => {
                  const used = groupsUsing(list.id);
                  return (
                    <ListItem
                      key={list.id}
                      accessibilityLabel={fill(t('pricing.lists.open'), { name: list.name })}
                      onPress={() => router.push(`/pricing/${list.id}`)}
                      title={
                        <View className="flex-row items-center gap-2">
                          <Text
                            variant="label"
                            className="min-w-0 flex-1 font-semibold text-foreground"
                            numberOfLines={1}
                          >
                            {list.name}
                          </Text>
                          <Badge variant={list.isActive ? 'success' : 'outline'}>
                            {list.isActive ? t('pricing.lists.active') : t('pricing.lists.inactive')}
                          </Badge>
                        </View>
                      }
                      description={
                        <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                          {`${fill(t('pricing.lists.ruleCount'), {
                            count: ruleCounts.get(list.id) ?? 0,
                          })} · ${
                            used > 0
                              ? fill(t('pricing.lists.groupUsage'), { count: used })
                              : t('pricing.lists.groupUsageNone')
                          }`}
                        </Text>
                      }
                      trailing={<AppIcon name="chevron-right" size={20} tone="subtle-foreground" />}
                    />
                  );
                })}
              </ListGroup>
            )}
          </View>
        </TabsContent>

        <TabsContent value="groups">
          <View className="gap-3">
            <View className="flex-row justify-end">
              <Button onPress={() => setGroupDialog({ open: true })}>{t('pricing.groups.add')}</Button>
            </View>
            {customerGroups.length === 0 ? (
              <EmptyState
                title={t('pricing.groups.empty')}
                description={t('pricing.groups.emptyDescription')}
              />
            ) : (
              <ListGroup>
                {customerGroups.map((group) => (
                  <ListItem
                    key={group.id}
                    accessibilityLabel={group.name}
                    onPress={() => setGroupDialog({ open: true, group })}
                    title={
                      <View className="flex-row items-center gap-2">
                        <Text
                          variant="label"
                          className="min-w-0 flex-1 font-semibold text-foreground"
                          numberOfLines={1}
                        >
                          {group.name}
                        </Text>
                        <Text variant="label" className="font-bold text-foreground" numeric="tabular">
                          {`${group.discountPercent} %`}
                        </Text>
                      </View>
                    }
                    description={
                      <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                        {`${fill(t('pricing.groups.customerCount'), {
                          count: customerCounts.get(group.id) ?? 0,
                        })} · ${
                          priceLists.find((list) => list.id === group.priceListId)?.name ??
                          t('pricing.groups.priceListNone')
                        }`}
                      </Text>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </View>
        </TabsContent>
      </Tabs>

      <PriceListDialog
        open={listDialog.open}
        onOpenChange={(open) => setListDialog((previous) => ({ ...previous, open }))}
        priceList={listDialog.list}
        onSave={({ name, isActive }) =>
          upsertPriceList({
            id: listDialog.list?.id ?? `pricelist-${Date.now()}`,
            orgId: currentOrgId(),
            name,
            isActive,
          })
        }
      />

      <CustomerGroupDialog
        open={groupDialog.open}
        onOpenChange={(open) => setGroupDialog((previous) => ({ ...previous, open }))}
        group={groupDialog.group}
        priceLists={priceLists}
        onSave={({ name, discountPercent, priceListId }) =>
          upsertCustomerGroup({
            id: groupDialog.group?.id ?? `group-${Date.now()}`,
            orgId: currentOrgId(),
            name,
            discountPercent,
            priceListId,
          })
        }
      />
    </ScrollView>
  );
}
