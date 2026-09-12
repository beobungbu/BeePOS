import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, ChipGroup, EmptyState, SearchInput, Text } from '@beemvp/beeui-ui';
import { useCustomerStore } from '../../../data/customer-store';
import { useOrderStore } from '../../../data/order-store';
import { filterCustomers } from '../../../domain/customers';
import type { Customer, CustomerTier } from '../../../domain/types';
import { useT } from '../../../i18n';
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { formatDate } from '../../orders/lib/order-presentation';
import { fill } from '../../orders/lib/fill';
import { CustomerTable } from '../components/customer-table';
import { CustomerListGroup } from '../components/customer-list-group';
import { AddCustomerDialog, type NewCustomerInput } from '../components/add-customer-dialog';

const TIERS: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum'];

export function CustomersListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === 'phone';

  const customers = useCustomerStore((state) => state.customers);
  const upsertCustomer = useCustomerStore((state) => state.upsertCustomer);
  const setProfileExtra = useCustomerStore((state) => state.setProfileExtra);
  const orders = useOrderStore((state) => state.orders);

  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<CustomerTier | ''>('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(
    () => filterCustomers(customers, { search: search || undefined, tier: tier || undefined }),
    [customers, search, tier],
  );

  const lastOrderLabel = (customerId: string): string | null => {
    const customerOrders = orders.filter((order) => order.customerId === customerId);
    if (customerOrders.length === 0) return null;
    const latest = customerOrders.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    return formatDate(latest.createdAt);
  };

  const handleCreate = (input: NewCustomerInput) => {
    const id = `customer-${Date.now()}`;
    const newCustomer: Customer = {
      id,
      name: input.name,
      phone: input.phone,
      points: 0,
      tier: 'bronze',
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    upsertCustomer(newCustomer);
    if (input.birthday || input.note) {
      setProfileExtra(id, { birthday: input.birthday ?? undefined, note: input.note || undefined });
    }
  };

  const gutter = isPhone ? 'px-4' : breakpoint === 'tablet' ? 'px-5' : 'px-6';

  return (
    <View className="flex-1 bg-background">
      <View className={`flex-row items-start justify-between gap-3 bg-surface pb-2 pt-3 ${gutter}`}>
        <View className="min-w-0 gap-0.5">
          <Text className="text-title font-bold text-foreground">{t('customers.title')}</Text>
          <Text className="text-caption text-muted-foreground">
            {fill(t('customers.results'), { count: filtered.length })}
          </Text>
        </View>
        <Button onPress={() => setAddOpen(true)}>{t('customers.addButton')}</Button>
      </View>

      <View className={`gap-3 border-b border-border bg-surface pb-3 pt-1 ${gutter}`}>
        <SearchInput accessibilityLabel={t('customers.search')} onSearch={setSearch} placeholder={t('customers.search')} />
        <ScrollView contentContainerClassName="flex-row items-center gap-2 pr-4" horizontal showsHorizontalScrollIndicator={false}>
          <ChipGroup
            className="flex-row flex-nowrap gap-2"
            onValueChange={(v) => setTier(v === 'all' ? '' : (v as CustomerTier))}
            selectionMode="single"
            value={tier || 'all'}
          >
            <Chip value="all">{t('customers.tier.all')}</Chip>
            {TIERS.map((item) => (
              <Chip key={item} value={item}>
                {t(`customers.tier.${item}`)}
              </Chip>
            ))}
          </ChipGroup>
        </ScrollView>
      </View>

      <ScrollView className="min-h-0 flex-1" contentContainerClassName="pb-6 pt-3">
        {filtered.length === 0 ? (
          <View className={`py-8 ${gutter}`}>
            <EmptyState description={t('customers.empty.description')} title={t('customers.empty.title')} />
          </View>
        ) : isPhone ? (
          <CustomerListGroup customers={filtered} lastOrderLabel={lastOrderLabel} />
        ) : (
          <CustomerTable
            customers={filtered}
            lastOrderLabel={lastOrderLabel}
            showLastOrder={breakpoint === 'desktop'}
          />
        )}
      </ScrollView>

      <AddCustomerDialog onCreate={handleCreate} onOpenChange={setAddOpen} open={addOpen} />
    </View>
  );
}
