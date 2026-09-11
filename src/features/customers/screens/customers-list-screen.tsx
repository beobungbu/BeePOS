import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Chip, ChipGroup, EmptyState, HStack, SearchInput, Text, VStack } from '@beemvp/beeui-ui';
import { useCustomerStore } from '../../../data/customer-store';
import { useOrderStore } from '../../../data/order-store';
import { filterCustomers } from '../../../domain/customers';
import type { Customer, CustomerTier } from '../../../domain/types';
import { useT } from '../../../i18n';
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { useIsWide } from '../hooks/use-is-wide';
import { CustomerTable } from '../components/customer-table';
import { CustomerListGroup } from '../components/customer-list-group';
import { AddCustomerDialog, type NewCustomerInput } from '../components/add-customer-dialog';

const TIERS: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum'];

export function CustomersListScreen() {
  const t = useT();
  const isWide = useIsWide();
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
    return new Date(latest.createdAt).toLocaleDateString('vi-VN');
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

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <HStack className="flex-wrap items-center justify-between gap-3">
        <Text variant="heading">{t('customers.title')}</Text>
        <Button onPress={() => setAddOpen(true)}>{t('customers.addButton')}</Button>
      </HStack>
      <SearchInput onSearch={setSearch} placeholder={t('customers.search')} />
      <ChipGroup
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
      {filtered.length === 0 ? (
        <EmptyState description={t('customers.empty.description')} title={t('customers.empty.title')} />
      ) : isWide ? (
        <CustomerTable customers={filtered} lastOrderLabel={lastOrderLabel} />
      ) : (
        <VStack className="gap-3">
          <CustomerListGroup customers={filtered} />
        </VStack>
      )}
      <AddCustomerDialog onCreate={handleCreate} onOpenChange={setAddOpen} open={addOpen} />
    </ScrollView>
  );
}
